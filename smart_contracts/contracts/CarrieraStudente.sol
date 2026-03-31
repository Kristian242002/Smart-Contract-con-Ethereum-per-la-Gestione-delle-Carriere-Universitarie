// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CarrieraStudente {

    //Strutture : 
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

    // variabili pubbliche 
    address public studente;
    Esame[] public esami;

    constructor(address _studente) {
        studente = _studente;
    }


    // calldata : per i tipi + dinamici come le stringhe bisogna scegliere se inserire calldata,memory o storage in 
    // ho scelto calldata pk mi serve il valore in sola letture evitando di copaire la stringa in memoria e consuma meno gas
    function registraEsame(string calldata _nome, int _voto,int _cfu) external returns (uint esameId) {
        require(_voto >= 0 && _voto <= 31, "Voto non valido");
        require(_cfu >= 1 && _cfu <= 20, "CFU per materia non validi possono essere al massimo 20 e al minimo 1");
        require(bytes(_nome).length > 0, "Il campo nome non puo essere vuoto");

        StatoEsame statoIniziale;
        if (_voto < 18) {
            statoIniziale = StatoEsame.INSUFFICIENTE;
        } else {
            statoIniziale = StatoEsame.IN_ATTESA;
        }

        esameId = esami.length;
        esami.push(Esame({
            nome:_nome,
            voto:_voto,
            cfu:_cfu,
            stato:statoIniziale
        }));
    }

    function accettaEsame(uint _esameId) external {
        require(msg.sender == studente, "Solo lo studente puo' accettare");
        require(_esameId < esami.length, "Esame inesistente");
        require(esami[_esameId].stato != StatoEsame.INSUFFICIENTE, "Esame insufficiente, non accettabile");
        require(esami[_esameId].stato != StatoEsame.ACCETTATO, "Esame gia' accettato");
        require(esami[_esameId].stato != StatoEsame.RIFIUTATO, "Esame gia' rifiutato");

        esami[_esameId].stato = StatoEsame.ACCETTATO;
    }

    function rifiutaEsame(uint _esameId) external {
        require(msg.sender == studente, "Solo lo studente puo' rifiutare");
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