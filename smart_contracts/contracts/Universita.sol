// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";
import "./Corso.sol";
import "./UniversitaFactory.sol";

contract Universita {

    address public segreteria;
    UniversitaFactory public factory;

    mapping(address => bool) public professori;
    address[] public listaProfessori;

    address[] public listaCorsi;

    constructor(address _segreteria) {
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        segreteria = _segreteria;
        factory = new UniversitaFactory(address(this));
    }

    // Gestione professori

    function aggiungiProfessore(address _professore) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(_professore != address(0), "Indirizzo professore non valido");
        require(!professori[_professore], "Professore gia' registrato");

        professori[_professore] = true;
        listaProfessori.push(_professore);
    }

    function rimuoviProfessore(address _professore) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(professori[_professore], "Professore non registrato");

        professori[_professore] = false;
    }

    // Gestione Studenti 

    function registraStudente(address _studente) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        factory.creaCarriera(_studente);
    }

    // Gestione Corsi

    function creaCorso(string memory _nome, int _cfu, uint _maxStudenti, address _professore) external returns (address) {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(professori[_professore], "Il professore non e' registrato nell'universita'");

        Corso nuovoCorso = new Corso(_nome, _cfu, _maxStudenti, _professore, address(this));
        listaCorsi.push(address(nuovoCorso));

        return address(nuovoCorso);
    }

    function iscriviStudenteACorso(address _studente, address _corso) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");

        address carriera = factory.getCarriera(_studente);

        Corso(_corso).iscriviStudente(_studente, carriera);
    }
    
    function chiudiIscrizioniCorso(address _corso) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        Corso(_corso).chiudiIscrizioni();
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