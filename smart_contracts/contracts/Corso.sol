// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CarrieraStudente.sol";

contract Corso {

    //Strutture :
    enum StatoCorso {
        APERTO,
        CHIUSO,
        CONCLUSO
    }

    string public nome;
    int public cfu;
    uint public maxStudenti;
    uint public numeroIscritti;

    address public professore;
    address public segreteria;

    StatoCorso public stato;

   // dizionario con : studente (chiave) => indirizzo del suo contratto CarrieraStudente
    mapping(address => address) public carriere;
    address[] public iscritti;

  constructor(string memory _nome,int _cfu,uint _maxStudenti,address _professore,address _segreteria) {
        require(bytes(_nome).length > 0, "Il nome del corso non puo' essere vuoto");
        require(_cfu >= 1 && _cfu <= 20, "CFU non validi");
        require(_maxStudenti > 0, "Il numero massimo di studenti deve essere maggiore di zero");
        require(_professore != address(0), "Indirizzo professore non valido");
        require(_segreteria != address(0), "Indirizzo segreteria non valido");

        nome = _nome;
        cfu = _cfu;
        maxStudenti = _maxStudenti;
        professore = _professore;
        segreteria = _segreteria;
        stato = StatoCorso.APERTO;
    }


    function chiudiIscrizioni() external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(stato == StatoCorso.APERTO, "Operazione non consentita nello stato corrente");
        stato = StatoCorso.CHIUSO;
    }

    function concludiCorso() external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(stato == StatoCorso.CHIUSO, "Operazione non consentita nello stato corrente");
        stato = StatoCorso.CONCLUSO;
    }

    function iscriviStudente(address _studente, address _carriera) external {
        require(msg.sender == segreteria, "Solo la segreteria puo' eseguire questa operazione");
        require(stato == StatoCorso.APERTO, "Operazione non consentita nello stato corrente");
        require(_studente != address(0), "Indirizzo studente non valido");
        require(_carriera != address(0), "Indirizzo carriera non valido");
        require(carriere[_studente] == address(0), "Studente gia' iscritto");
        require(numeroIscritti < maxStudenti, "Numero massimo di studenti raggiunto");

        carriere[_studente] = _carriera;
        iscritti.push(_studente);
        numeroIscritti++;
    }

    function registraVoto(address _studente, int _voto, bool _lode) external {
        require(msg.sender == professore || msg.sender == segreteria,"Solo il professore o la segreteria possono eseguire questa operazione");
        require(stato == StatoCorso.CHIUSO, "Operazione non consentita nello stato corrente");
        require(carriere[_studente] != address(0), "Studente non iscritto al corso");
        require(_voto >= 0 && _voto <= 30, "Voto non valido: deve essere tra 0 e 30");
        require(!(_lode && _voto != 30), "La lode e' consentita solo con voto 30");

        int votoFinale;
        if (_lode) {
            votoFinale = 31;
        } else {
            votoFinale = _voto;
        }

        CarrieraStudente carriera = CarrieraStudente(carriere[_studente]);
        carriera.registraEsame(nome, votoFinale, cfu);
    }

    function getIscritti() external view returns (address[] memory) {
        return iscritti;
    }

    function getStato() external view returns (StatoCorso) {
        return stato;
    }

    function isStudenteIscritto(address _studente) external view returns (bool) {
        return carriere[_studente] != address(0);
    }
}
