// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";

contract CarrieraStudenteFactory {

    address public segreteria;
    address public universita;
    uint public numeroStudenti;

    bytes32 public STUDENTE_ROLE;
    bytes32 public CORSO_ROLE;

    mapping(address => address) public carriere;

    constructor(address _segreteria, address _universita, bytes32 _studenteRole, bytes32 _corsoRole) {
        require(_segreteria != address(0), "Indirizzo segreteria non valido");
        require(_universita != address(0), "Indirizzo universita non valido");
        segreteria = _segreteria;
        universita = _universita;
        STUDENTE_ROLE = _studenteRole;
        CORSO_ROLE = _corsoRole;
    }

    function creaCarriera(address _studente,CarrieraStudente.TipoLaurea _tipoLaurea,string memory _nome,string memory _cognome) external returns (address) {
        require(msg.sender == universita, "Non autorizzato");
        require(_studente != address(0), "Indirizzo studente non valido");
        require(carriere[_studente] == address(0), "Carriera gia' esistente per questo studente");

        CarrieraStudente nuovaCarriera = new CarrieraStudente(_studente,segreteria,universita,STUDENTE_ROLE,CORSO_ROLE,_tipoLaurea,_nome,_cognome);
        carriere[_studente] = address(nuovaCarriera);
        numeroStudenti++;

        return address(nuovaCarriera);
    }

    function getCarriera(address _studente) external view returns (address) {
        require(carriere[_studente] != address(0), "Nessuna carriera trovata per questo studente");
        return carriere[_studente];
    }
}