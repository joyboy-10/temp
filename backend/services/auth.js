const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { readDB, writeDB } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const SALT_ROUNDS = 12;

class AuthService {
  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Login auditor
  async loginAuditor(institutionId, password) {
    const db = readDB();
    const institution = db.institutions[institutionId];
    
    if (!institution) {
      throw new Error('Institution not found');
    }

    const auditor = db.auditors[institution.auditorId];
    if (!auditor) {
      throw new Error('Auditor not found');
    }

    const isValid = await this.verifyPassword(password, auditor.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken({
      userId: auditor.id,
      institutionId,
      role: 'auditor',
      address: auditor.walletAddress
    });

    return {
      token,
      user: {
        id: auditor.id,
        institutionId,
        role: 'auditor',
        address: auditor.walletAddress
      }
    };
  }

  // Login associate
  async loginAssociate(institutionId, username, password) {
    const db = readDB();
    const institution = db.institutions[institutionId];
    
    if (!institution) {
      throw new Error('Institution not found');
    }

    const associate = Object.values(db.associates).find(
      a => a.institutionId === institutionId && a.username === username
    );
    
    if (!associate) {
      throw new Error('Associate not found');
    }

    const isValid = await this.verifyPassword(password, associate.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken({
      userId: associate.id,
      institutionId,
      role: 'associate',
      address: associate.walletAddress
    });

    return {
      token,
      user: {
        id: associate.id,
        username: associate.username,
        institutionId,
        role: 'associate',
        address: associate.walletAddress
      }
    };
  }

  // Create associate
  async createAssociate(institutionId, username, password, createdBy) {
    const db = readDB();
    const institution = db.institutions[institutionId];
    
    if (!institution) {
      throw new Error('Institution not found');
    }

    // Check if username already exists for this institution
    const existingAssociate = Object.values(db.associates).find(
      a => a.institutionId === institutionId && a.username === username
    );
    
    if (existingAssociate) {
      throw new Error('Username already exists for this institution');
    }

    // Check associate limit
    const existingAssociates = Object.values(db.associates).filter(
      a => a.institutionId === institutionId
    );
    
    if (existingAssociates.length >= 2) {
      throw new Error('Maximum 2 associates allowed per institution');
    }

    // Generate unique associate ID
    let empId;
    do {
      empId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
    } while (db.associates[empId]);

    // Create wallet
    const { ethers } = require('ethers');
    const wallet = ethers.Wallet.createRandom();
    
    const passwordHash = await this.hashPassword(password);

    const associate = {
      id: empId,
      username,
      institutionId,
      walletAddress: wallet.address,
      privateKey: wallet.privateKey,
      passwordHash,
      createdBy,
      createdAt: new Date().toISOString()
    };

    db.associates[empId] = associate;
    writeDB(db);

    return {
      empId,
      username,
      address: wallet.address
    };
  }

  // Delete associate
  async deleteAssociate(institutionId, username, auditorPassword) {
    const db = readDB();
    const institution = db.institutions[institutionId];
    
    if (!institution) {
      throw new Error('Institution not found');
    }

    // Verify auditor password
    const auditor = db.auditors[institution.auditorId];
    if (!auditor) {
      throw new Error('Auditor not found');
    }

    const isValidPassword = await this.verifyPassword(auditorPassword, auditor.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid auditor password');
    }

    // Find associate by username
    const associate = Object.values(db.associates).find(
      a => a.institutionId === institutionId && a.username === username
    );
    
    if (!associate) {
      throw new Error('Associate not found');
    }

    // Delete associate
    delete db.associates[associate.id];
    writeDB(db);

    return {
      success: true,
      deletedAssociate: {
        id: associate.id,
        username: associate.username
      }
    };
  }
}

module.exports = new AuthService();