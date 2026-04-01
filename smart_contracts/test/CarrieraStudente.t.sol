// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/CarrieraStudente.sol";
import {Test} from "forge-std/Test.sol";

contract CarrieraStudenteTest is Test {

    CarrieraStudente carriera;
    address studente1 = makeAddr("studente1");
    address studente2 = makeAddr("studente2");

    function setUp() public {
        carriera = new CarrieraStudente(studente1);
    }

    //Test su registra esame

    function test_RegistraEsameValido() public {
        carriera.registraEsame("Analisi I", 28, 6);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(esame.voto, 28);
        assertEq(esame.cfu, 6);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.IN_ATTESA));
    }

    function test_RegistraEsameInsuffficiente() public {
        carriera.registraEsame("Fisica I", 15, 6);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.INSUFFICIENTE));
    }

    function test_RegistraLode() public {
        carriera.registraEsame("Analisi", 31, 9);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(esame.voto, 31);
    }

    function test_VotoTroppoAltoError() public {
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 32, 6);
    }

    function test_CFUZeroError() public {
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 25, 0);
    }

    function test_CFUTroppoAltiError() public {
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 25, 21);
    }

    function test_NomeVuotoError() public {
        vm.expectRevert();
        carriera.registraEsame("", 25, 6);
    }

    function test_VotoNegativoError() public {
        vm.expectRevert();
        carriera.registraEsame("Analisi I", -5, 6);
    }

    function test_NumeroEsamiIncrementa() public {
        carriera.registraEsame("Analisi I", 28, 6);
        carriera.registraEsame("Basi di Dati", 25, 12);
        assertEq(carriera.getNumeroEsami(), 2);
    }

    function test_DueEsamiVotiDiversi() public {
        carriera.registraEsame("Analisi I", 10, 6); 
        carriera.registraEsame("Fisica I", 25, 6);   

        CarrieraStudente.Esame memory primo = carriera.getEsame(0);
        CarrieraStudente.Esame memory secondo = carriera.getEsame(1);

        assertEq(uint(primo.stato), uint(CarrieraStudente.StatoEsame.INSUFFICIENTE));
        assertEq(uint(secondo.stato), uint(CarrieraStudente.StatoEsame.IN_ATTESA));
    }

    // Test su Accetta Esame

     function test_StudenteAccettaEsame() public {
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.ACCETTATO));
    }

    function test_AltroUtenteAccettaError() public { 
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente2);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    function test_AccettaEsameInsuffError() public {
        carriera.registraEsame("Fisica I", 10, 6);
        vm.prank(studente1);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    function test_AccettaEsameGiaAccettatoError() public { 
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        vm.prank(studente1);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    // Rifiuta esame

    function test_StudenteRifiutaEsame() public {
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.rifiutaEsame(0);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.RIFIUTATO));
    }

    function test_AltroUtenteRifiutaError() public {
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente2);
        vm.expectRevert();
        carriera.rifiutaEsame(0);
    }

    function test_RifiutaEsameGiaRifiutatoError() public {
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.rifiutaEsame(0);
        vm.prank(studente2);
        vm.expectRevert();
        carriera.rifiutaEsame(0);
    }

    // cfu totali

        function test_CFUTotaliZeroSenzaAccettati() public {
        carriera.registraEsame("Analisi I", 28, 6);
        assertEq(carriera.getCFUTotali(), 0);
    }

    function test_CFUTotaliSoloAccettati() public {
        carriera.registraEsame("Analisi I", 28, 6);
        carriera.registraEsame("Fisica I", 25, 6);
        carriera.registraEsame("Basi di Dati", 10, 12);
        vm.prank(studente1); // Accetti esame Analisi I
        carriera.accettaEsame(0);
        vm.prank(studente1); // Accetto esame FisicaI
        carriera.accettaEsame(1);
        assertEq(carriera.getCFUTotali(), 12);
    }

    // isLaureato

    function test_IsLaureato() public {
        carriera.registraEsame("Analisi I", 28, 6);
        carriera.registraEsame("Fisica I", 25, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        vm.prank(studente1);
        carriera.accettaEsame(1);
        assertEq(carriera.isLaureato(12), true);
    }

    function test_NonIsLaureato() public {
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        assertEq(carriera.isLaureato(180), false);
    }
}