// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarrieraStudente is AccessControl {

    enum StatoEsame {
        IN_ATTESA,
        ACCETTATO,
        RIFIUTATO,
        INSUFFICIENTE
    }

    enum TipoLaurea {
        TRIENNALE,
        MAGISTRALE
    }

    struct Esame {
        string nome;
        int voto;
        int cfu;
        StatoEsame stato;
    }

    struct StudenteInfo {
        address wallet;
        string nome;
        string cognome;
        TipoLaurea tipoLaurea;
        int cfuTotali;
        bool laureato;
        Esame[] esami;
    }

    address public studente;
    string public nome;
    string public cognome;
    TipoLaurea public tipoLaurea;
    Esame[] public esami;

    bytes32 public STUDENTE_ROLE;
    bytes32 public CORSO_ROLE;

    int public cfuAccettati;

    constructor(address _studente,address _segreteria,address _universita,bytes32 _studenteRole,bytes32 _corsoRole,TipoLaurea _tipoLaurea,string memory _nome,string memory _cognome) {
        require(_studente != address(0), "Indirizzo studente non valido");
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        require(_universita != address(0), "Indirizzo universita non valido");
        require(bytes(_nome).length > 0, "Il nome non puo' essere vuoto");
        require(bytes(_cognome).length > 0, "Il cognome non puo' essere vuoto");

        studente = _studente;
        nome = _nome;
        cognome = _cognome;
        tipoLaurea = _tipoLaurea;
        STUDENTE_ROLE = _studenteRole;
        CORSO_ROLE = _corsoRole;

        _grantRole(DEFAULT_ADMIN_ROLE, _segreteria);
        _grantRole(DEFAULT_ADMIN_ROLE, _universita);
        _grantRole(STUDENTE_ROLE, _studente);
    }

    // Accetta sia lo studente diretto, sia Universita che agisce per suo conto
    modifier soloStudente(address _studente) {
        require(hasRole(STUDENTE_ROLE, msg.sender) ||(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && hasRole(STUDENTE_ROLE, _studente)),"Non autorizzato");_;
    }

    function aggiornaNome(string memory _nome, address _studente) external soloStudente(_studente) {
        require(bytes(_nome).length > 0, "Il nome non puo' essere vuoto");
        nome = _nome;
    }

    function aggiornaCognome(string memory _cognome, address _studente) external soloStudente(_studente) {
        require(bytes(_cognome).length > 0, "Il cognome non puo' essere vuoto");
        cognome = _cognome;
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

    function accettaEsame(uint _esameId, address _studente) external soloStudente(_studente) {
        require(_esameId < esami.length, "Esame inesistente");
        require(esami[_esameId].stato != StatoEsame.INSUFFICIENTE, "Esame insufficiente, non accettabile");
        require(esami[_esameId].stato != StatoEsame.ACCETTATO, "Esame gia' accettato");
        require(esami[_esameId].stato != StatoEsame.RIFIUTATO, "Esame gia' rifiutato");
        esami[_esameId].stato = StatoEsame.ACCETTATO;
        cfuAccettati += esami[_esameId].cfu;
    }

    function rifiutaEsame(uint _esameId, address _studente) external soloStudente(_studente) {
        require(_esameId < esami.length, "Esame inesistente");
        require(esami[_esameId].stato != StatoEsame.INSUFFICIENTE, "Esame insufficiente, viene ignorato automaticamente");
        require(esami[_esameId].stato != StatoEsame.ACCETTATO, "Esame gia' accettato");
        require(esami[_esameId].stato != StatoEsame.RIFIUTATO, "Esame gia' rifiutato");
        esami[_esameId].stato = StatoEsame.RIFIUTATO;
    }

    function getCFUTotali() public view returns (int) {
        return cfuAccettati;
    }

    function getNumeroEsami() external view returns (uint) {
        return esami.length;
    }

    function getEsame(uint _esameId) external view returns (Esame memory) {
        require(_esameId < esami.length, "Esame inesistente");
        return esami[_esameId];
    }

    function isLaureato() external view returns (bool) {
        int cfuNecessari = 180;
        if (tipoLaurea == TipoLaurea.MAGISTRALE) {
            cfuNecessari = 120;
        }
        return getCFUTotali() >= cfuNecessari;
    }

    function getStudenteInfo() external view returns (StudenteInfo memory) {
        StudenteInfo memory info;
        info.wallet = studente;
        info.nome = nome;
        info.cognome = cognome;
        info.tipoLaurea = tipoLaurea;
        info.cfuTotali = getCFUTotali();

        int cfuNecessari = 180;
        if (tipoLaurea == TipoLaurea.MAGISTRALE) {
            cfuNecessari = 120;
        }
        info.laureato = getCFUTotali() >= cfuNecessari;
        info.esami = esami;

        return info;
    }
}