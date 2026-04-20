// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarrieraStudente is AccessControl {

    bytes32 public constant STUDENTE_ROLE = keccak256("STUDENTE_ROLE");
    bytes32 public constant CORSO_ROLE = keccak256("CORSO_ROLE");

    enum StatoEsame {
        IN_ATTESA,
        ACCETTATO,
        RIFIUTATO,
        INSUFFICIENTE
    }

    struct Esame {
        string nome;
        int voto;
        int cfu;
        StatoEsame stato;
    }

    address public studente;
    Esame[] public esami;

    constructor(address _studente, address _segreteria, address _universita) {
        require(_studente != address(0), "Indirizzo studente non valido");
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        require(_universita != address(0), "Indirizzo universita non valido");

        studente = _studente;

        _grantRole(DEFAULT_ADMIN_ROLE, _segreteria);
        _grantRole(DEFAULT_ADMIN_ROLE, _universita);
        _grantRole(STUDENTE_ROLE, _studente);
    }

    function registraEsame(string calldata _nome, int _voto, int _cfu) external onlyRole(CORSO_ROLE) returns (uint esameId) {
        require(_voto >= 0 && _voto <= 31, "Voto non valido");
        require(_cfu >= 1 && _cfu <= 20, "CFU non validi");
        require(bytes(_nome).length > 0, "Il nome non puo' essere vuoto");

        StatoEsame statoIniziale;
        if (_voto < 18) {
            statoIniziale = StatoEsame.INSUFFICIENTE;
        } else {
            statoIniziale = StatoEsame.IN_ATTESA;
        }

        esameId = esami.length;
        esami.push(Esame({
            nome: _nome,
            voto: _voto,
            cfu: _cfu,
            stato: statoIniziale
        }));
    }

    function accettaEsame(uint _esameId) external onlyRole(STUDENTE_ROLE) {
        require(_esameId < esami.length, "Esame inesistente");
        require(esami[_esameId].stato != StatoEsame.INSUFFICIENTE, "Esame insufficiente, non accettabile");
        require(esami[_esameId].stato != StatoEsame.ACCETTATO, "Esame gia' accettato");
        require(esami[_esameId].stato != StatoEsame.RIFIUTATO, "Esame gia' rifiutato");

        esami[_esameId].stato = StatoEsame.ACCETTATO;
    }

    function rifiutaEsame(uint _esameId) external onlyRole(STUDENTE_ROLE) {
        require(_esameId < esami.length, "Esame inesistente");
        require(esami[_esameId].stato != StatoEsame.INSUFFICIENTE, "Esame insufficiente, viene ignorato automaticamente");
        require(esami[_esameId].stato != StatoEsame.ACCETTATO, "Esame gia' accettato");
        require(esami[_esameId].stato != StatoEsame.RIFIUTATO, "Esame gia' rifiutato");

        esami[_esameId].stato = StatoEsame.RIFIUTATO;
    }

    function getCFUTotali() public view returns (int totale) {
        for (uint i = 0; i < esami.length; i++) {
            if (esami[i].stato == StatoEsame.ACCETTATO) {
                totale += esami[i].cfu;
            }
        }
    }

    function getNumeroEsami() external view returns (uint) {
        return esami.length;
    }

    function getEsame(uint _esameId) external view returns (Esame memory) {
        require(_esameId < esami.length, "Esame inesistente");
        return esami[_esameId];
    }

    function isLaureato(int _cfuNecessari) external view returns (bool) {
        return getCFUTotali() >= _cfuNecessari;
    }
}