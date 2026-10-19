// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";
import "./Corso.sol";
import "./CarrieraStudenteFactory.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Universita is AccessControl {

    bytes32 public constant SEGRETERIA_ROLE = keccak256("SEGRETERIA_ROLE");
    bytes32 public constant PROFESSORE_ROLE = keccak256("PROFESSORE_ROLE");
    bytes32 public constant STUDENTE_ROLE = keccak256("STUDENTE_ROLE");
    bytes32 public constant CORSO_ROLE = keccak256("CORSO_ROLE");

    struct Professore {
        string nome;
        string cognome;
    }

    CarrieraStudenteFactory public factory;
    mapping(address => bool) public professori;
    // Nome e cognome restano salvati anche se il professore viene rimosso:
    // i suoi corsi continuano a mostrare chi li ha tenuti
    mapping(address => Professore) private datiProfessori;
    address[] public listaProfessori;
    address[] public listaCorsi;
    mapping(address => bool) public corsiValidi; // corsi creati da questo contratto

    constructor(address _segreteria) {
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        _grantRole(DEFAULT_ADMIN_ROLE, _segreteria);
        _grantRole(SEGRETERIA_ROLE, _segreteria);
        factory = new CarrieraStudenteFactory(_segreteria, address(this), STUDENTE_ROLE, CORSO_ROLE);
    }

    // -------------------------------------------------------
    // SEGRETERIA
    // -------------------------------------------------------

    function aggiungiProfessore(address _professore, string memory _nome, string memory _cognome) external onlyRole(SEGRETERIA_ROLE) {
        require(_professore != address(0), "Indirizzo professore non valido");
        require(!professori[_professore], "Professore gia' registrato");
        require(bytes(_nome).length > 0 && bytes(_cognome).length > 0, "Nome e cognome obbligatori");
        professori[_professore] = true;
        datiProfessori[_professore] = Professore(_nome, _cognome);
        listaProfessori.push(_professore);
        _grantRole(PROFESSORE_ROLE, _professore);
    }

    function rimuoviProfessore(address _professore) external onlyRole(SEGRETERIA_ROLE) {
        require(professori[_professore], "Professore non registrato");
        professori[_professore] = false;
        _revokeRole(PROFESSORE_ROLE, _professore);
        for (uint i = 0; i < listaProfessori.length; i++) {
            if (listaProfessori[i] == _professore) {
                listaProfessori[i] = listaProfessori[listaProfessori.length - 1];
                listaProfessori.pop();
                break;
            }
        }
    }

    function registraStudente(address _studente,CarrieraStudente.TipoLaurea _tipoLaurea,string memory _nome,string memory _cognome) external onlyRole(SEGRETERIA_ROLE) {
        factory.creaCarriera(_studente, _tipoLaurea, _nome, _cognome);
        _grantRole(STUDENTE_ROLE, _studente);
    }

    function creaCorso(string memory _nome,int _cfu,uint _maxStudenti,address _professore) external onlyRole(SEGRETERIA_ROLE) returns (address) {
        require(professori[_professore], "Il professore non e' registrato nell'universita'");
        Corso nuovoCorso = new Corso( _nome, _cfu, _maxStudenti, _professore, msg.sender, address(this), SEGRETERIA_ROLE, PROFESSORE_ROLE);
        listaCorsi.push(address(nuovoCorso));
        corsiValidi[address(nuovoCorso)] = true;
        return address(nuovoCorso);
    }

    // Segreteria, oppure il professore a cui è assegnato il corso (e che è ancora abilitato)
    function _segreteriaOProfessoreDelCorso(address _corso) internal view returns (bool) {
        if (hasRole(SEGRETERIA_ROLE, msg.sender)) return true;
        return hasRole(PROFESSORE_ROLE, msg.sender) && Corso(_corso).professore() == msg.sender;
    }

    function iscriviStudenteACorso(address _studente, address _corso) external {
        // Solo corsi creati da questo contratto: un contratto "finto" riceverebbe CORSO_ROLE sulla carriera
        require(corsiValidi[_corso], "Corso non valido");
        require(_segreteriaOProfessoreDelCorso(_corso), "Solo la segreteria o il professore del corso possono iscrivere studenti");
        address carrieraAddr = factory.getCarriera(_studente);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        carriera.grantRole(CORSO_ROLE, _corso);
        Corso(_corso).iscriviStudente(_studente, carrieraAddr);
    }

    function chiudiIscrizioniCorso(address _corso) external onlyRole(SEGRETERIA_ROLE) {
        Corso(_corso).chiudiIscrizioni();
    }

    function registraVoto(address _corso, address _studente, int _voto, bool _lode) external {
        require(corsiValidi[_corso], "Corso non valido");
        // Il professore può registrare voti solo nei SUOI corsi
        require(_segreteriaOProfessoreDelCorso(_corso), "Solo il professore o la segreteria possono eseguire questa operazione");
        Corso(_corso).registraVoto(_studente, _voto, _lode);
    }

    // -------------------------------------------------------
    // STUDENTE 
    // -------------------------------------------------------

    function accettaEsame(uint _esameId) external onlyRole(STUDENTE_ROLE) {
        address carrieraAddr = factory.getCarriera(msg.sender);
        CarrieraStudente(carrieraAddr).accettaEsame(_esameId, msg.sender);
    }

    function rifiutaEsame(uint _esameId) external onlyRole(STUDENTE_ROLE) {
        address carrieraAddr = factory.getCarriera(msg.sender);
        CarrieraStudente(carrieraAddr).rifiutaEsame(_esameId, msg.sender);
    }

    function aggiornaNome(string memory _nome) external onlyRole(STUDENTE_ROLE) {
        address carrieraAddr = factory.getCarriera(msg.sender);
        CarrieraStudente(carrieraAddr).aggiornaNome(_nome, msg.sender);
    }

    function aggiornaCognome(string memory _cognome) external onlyRole(STUDENTE_ROLE) {
        address carrieraAddr = factory.getCarriera(msg.sender);
        CarrieraStudente(carrieraAddr).aggiornaCognome(_cognome, msg.sender);
    }

    // -------------------------------------------------------
    // VIEW
    // -------------------------------------------------------

    function getQRCode(address _studente) external view returns (CarrieraStudente.StudenteInfo memory) {
        address carrieraAddr = factory.getCarriera(_studente);
        return CarrieraStudente(carrieraAddr).getStudenteInfo();
    }

    function getListaCorsi() external view returns (address[] memory) {
        return listaCorsi;
    }

    function getListaProfessori() external view returns (address[] memory) {
        return listaProfessori;
    }

    function getCarrieraStudente(address _studente) external view returns (address) {
        return factory.getCarriera(_studente);
    }

    function isProfessore(address _addr) external view returns (bool) {
        return professori[_addr];
    }

    function getProfessore(address _professore) external view returns (Professore memory) {
        return datiProfessori[_professore];
    }
}