// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BudgetLedger {
    enum TxStatus { Pending, Approved, Declined, Review }

    struct Institution {
        string name;
        string location;
        address auditor;
        bool exists;
    }

    struct LedgerTx {
        uint256 id;
        uint256 institutionOnchainId;
        address creator;
        address receiver;
        uint256 amount;
        string purpose;
        string comment;
        TxStatus status;
        uint256 createdAt;
        string auditorComment;
    }

    uint256 public institutionCount;
    uint256 public txCount;

    mapping(uint256 => Institution) public institutions;
    mapping(uint256 => LedgerTx) public transactions;
    mapping(uint256 => uint256[]) public institutionTxs;
    mapping(uint256 => uint256) public institutionBalance;

    event InstitutionRegistered(uint256 indexed onchainId, string name, address auditor);
    event DepositForInstitution(uint256 indexed onchainId, address from, uint256 amount);
    event TransactionCreated(uint256 indexed txId, uint256 indexed onchainId, address creator);
    event TransactionReviewed(uint256 indexed txId, uint8 status, string auditorComment);
    event TransactionPaid(uint256 indexed txId, address receiver, uint256 amount);

    function registerInstitution(string memory _name, string memory _location, address _auditor) public returns (uint256) {
        require(_auditor != address(0), "auditor zero");
        institutionCount++;
        institutions[institutionCount] = Institution(_name, _location, _auditor, true);
        emit InstitutionRegistered(institutionCount, _name, _auditor);
        return institutionCount;
    }

    function depositForInstitution(uint256 _onchainInstitutionId) public payable {
        require(institutions[_onchainInstitutionId].exists, "no such institution");
        institutionBalance[_onchainInstitutionId] += msg.value;
        emit DepositForInstitution(_onchainInstitutionId, msg.sender, msg.value);
    }

    function createTransaction(
        uint256 _onchainInstitutionId,
        address _receiver,
        uint256 _amount,
        string memory _purpose,
        string memory _comment
    ) public returns (uint256) {
        require(institutions[_onchainInstitutionId].exists, "no such institution");
        require(_receiver != address(0), "zero receiver");
        require(_amount > 0, "amount zero");

        txCount++;
        transactions[txCount] = LedgerTx(
            txCount,
            _onchainInstitutionId,
            msg.sender,
            _receiver,
            _amount,
            _purpose,
            _comment,
            TxStatus.Pending,
            block.timestamp,
            ""
        );
        institutionTxs[_onchainInstitutionId].push(txCount);
        emit TransactionCreated(txCount, _onchainInstitutionId, msg.sender);
        return txCount;
    }

    function reviewTransaction(uint256 _txId, uint8 _status, string memory _auditorComment) public {
        require(_txId > 0 && _txId <= txCount, "tx not found");
        LedgerTx storage t = transactions[_txId];
        uint256 instId = t.institutionOnchainId;
        require(institutions[instId].exists, "inst not found");
        require(msg.sender == institutions[instId].auditor, "only auditor");
        require(t.status == TxStatus.Pending || t.status == TxStatus.Review, "not editable");

        if (_status == uint8(TxStatus.Approved)) {
            require(institutionBalance[instId] >= t.amount, "insufficient institution balance");
            institutionBalance[instId] -= t.amount;
            t.status = TxStatus.Approved;
            t.auditorComment = _auditorComment;
            payable(t.receiver).transfer(t.amount);
            emit TransactionPaid(_txId, t.receiver, t.amount);
        } else if (_status == uint8(TxStatus.Declined)) {
            t.status = TxStatus.Declined;
            t.auditorComment = _auditorComment;
        } else if (_status == uint8(TxStatus.Review)) {
            t.status = TxStatus.Review;
            t.auditorComment = _auditorComment;
        } else {
            revert("invalid status");
        }
        emit TransactionReviewed(_txId, uint8(t.status), _auditorComment);
    }

    function getTxIdsForInstitution(uint256 _onchainInstitutionId) public view returns (uint256[] memory) {
        return institutionTxs[_onchainInstitutionId];
    }

    function getInstitutionBalance(uint256 _onchainInstitutionId) public view returns (uint256) {
        return institutionBalance[_onchainInstitutionId];
    }
}
