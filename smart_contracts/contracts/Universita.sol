// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";
import "./Corso.sol";
import "./CarrieraStudenteFactory.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract Universita is AccessControlEnumerable {

    bytes32 public constant SEGRETERIA_ROLE  = keccak256("SEGRETERIA_ROLE");
    bytes32 public constant PROFESSORE_ROLE  = keccak256("PROFESSORE_ROLE");
    bytes32 public constant STUDENTE_ROLE    = keccak256("STUDENTE_ROLE");
    bytes32 public constant CORSO_ROLE       = keccak256("CORSO_ROLE");

    CarrieraStudenteFactory public factory;

    mapping(address => bool) public professori;
    address[] public listaProfessori;
    address[] public listaCorsi;

    constructor(address _segreteria) {
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        _grantRole(DEFAULT_ADMIN_ROLE, _segreteria);
        _grantRole(SEGRETERIA_ROLE, _segreteria);
        factory = new CarrieraStudenteFactory(_segreteria, address(this), STUDENTE_ROLE, CORSO_ROLE);
    }

    function aggiungiProfessore(address _professore) external onlyRole(SEGRETERIA_ROLE) {
        require(_professore != address(0), "Indirizzo professore non valido");
        require(!professori[_professore], "Professore gia' registrato");
        professori[_professore] = true;
        listaProfessori.push(_professore);
        _grantRole(PROFESSORE_ROLE, _professore); 
    }

    function rimuoviProfessore(address _professore) external onlyRole(SEGRETERIA_ROLE) {
        require(professori[_professore], "Professore non registrato");
        professori[_professore] = false;
        _revokeRole(PROFESSORE_ROLE, _professore);  
    }

    function registraStudente(
        address _studente,
        CarrieraStudente.TipoLaurea _tipoLaurea,
        string memory _nome,
        string memory _cognome
    ) external onlyRole(SEGRETERIA_ROLE) {
        factory.creaCarriera(_studente, _tipoLaurea, _nome, _cognome);
    }

    function creaCorso(string memory _nome, int _cfu, uint _maxStudenti, address _professore) external onlyRole(SEGRETERIA_ROLE) returns (address) {
        require(professori[_professore], "Il professore non e' registrato nell'universita'");
        address segreteriaReale = getRoleMember(SEGRETERIA_ROLE, 0);
        Corso nuovoCorso = new Corso(_nome, _cfu, _maxStudenti, _professore, segreteriaReale, address(this), SEGRETERIA_ROLE, PROFESSORE_ROLE);
        listaCorsi.push(address(nuovoCorso));
        return address(nuovoCorso);
    }

    function iscriviStudenteACorso(address _studente, address _corso) external onlyRole(SEGRETERIA_ROLE) {
        address carrieraAddr = factory.getCarriera(_studente);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        carriera.grantRole(CORSO_ROLE, _corso);
        Corso(_corso).iscriviStudente(_studente, carrieraAddr);
    }

    function chiudiIscrizioniCorso(address _corso) external onlyRole(SEGRETERIA_ROLE) {
        Corso(_corso).chiudiIscrizioni();
    }

    function registraVoto(address _corso, address _studente, int _voto, bool _lode) external {
        require(
            hasRole(SEGRETERIA_ROLE, msg.sender) || hasRole(PROFESSORE_ROLE, msg.sender),
            "Solo il professore o la segreteria possono eseguire questa operazione"
        );
        Corso(_corso).registraVoto(_studente, _voto, _lode);
    }

    function getQRCode(address _studente) external view returns (CarrieraStudente.StudenteInfo memory) {
        address carrieraAddr = factory.getCarriera(_studente);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        return carriera.getStudenteInfo();
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
}