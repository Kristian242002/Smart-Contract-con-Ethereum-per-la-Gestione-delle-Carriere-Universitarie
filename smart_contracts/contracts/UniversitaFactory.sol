// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";

contract UniversitaFactory {

    address public segreteria;
    address public universita;
    uint public numeroStudenti;

    mapping(address => address) public carriere;

    constructor(address _segreteria, address _universita) {
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        require(_universita != address(0), "Indirizzo universita non valido");
        segreteria = _segreteria;
        universita = _universita;
    }

    function creaCarriera(address _studente) external returns (address) {
        require(msg.sender == universita, "Non autorizzato");
        require(_studente != address(0), "Indirizzo studente non valido");
        require(carriere[_studente] == address(0), "Carriera gia' esistente per questo studente");

        // passa segreteria e universita al costruttore di CarrieraStudente
        CarrieraStudente nuovaCarriera = new CarrieraStudente(_studente, segreteria, universita);
        carriere[_studente] = address(nuovaCarriera);
        numeroStudenti++;

        return address(nuovaCarriera);
    }

    function getCarriera(address _studente) external view returns (address) {
        require(carriere[_studente] != address(0), "Nessuna carriera trovata per questo studente");
        return carriere[_studente];
    }
}