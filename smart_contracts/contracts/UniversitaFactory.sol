// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";

contract UniversitaFactory {

    address public autorizzato;
    uint public numeroStudenti;

    // dizionario con : studente (chiave) => indirizzo del suo contratto CarrieraStudente 
    mapping(address => address) public carriere;

    constructor(address _autorizzato) {
        autorizzato = _autorizzato;
    }

    function creaCarriera(address _studente) external returns (address) {
        require(msg.sender == autorizzato, "Non autorizzato");
        require(_studente != address(0), "Indirizzo studente non valido");
        require(carriere[_studente] == address(0), "Carriera gia' esistente per questo studente");

        CarrieraStudente nuovaCarriera = new CarrieraStudente(_studente);
        carriere[_studente] = address(nuovaCarriera);
        numeroStudenti++;

        return address(nuovaCarriera);
    }

    function getCarriera(address _studente) external view returns (address) {
        require(carriere[_studente] != address(0), "Nessuna carriera trovata per questo studente");
        return carriere[_studente];
    }
}