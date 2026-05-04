// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/CarrieraStudente.sol";
import {Test} from "forge-std/Test.sol";

contract CarrieraStudenteTest is Test {

    CarrieraStudente carriera;
    address studente1 = makeAddr("studente1");
    address studente2 = makeAddr("studente2");
    address segreteria = makeAddr("segreteria");
    address universita = makeAddr("universita");
    address corso = makeAddr("corso");

    bytes32 public constant CORSO_ROLE = keccak256("CORSO_ROLE");
    bytes32 public constant STUDENTE_ROLE = keccak256("STUDENTE_ROLE");

    function setUp() public {
        carriera = new CarrieraStudente(studente1, segreteria, universita, STUDENTE_ROLE, CORSO_ROLE, CarrieraStudente.TipoLaurea.TRIENNALE, "Mario", "Rossi");
        vm.prank(segreteria);
        carriera.grantRole(CORSO_ROLE, corso);
    }

    // ─── registraEsame ───────────────────────────────────────────

    function test_RegistraEsameValido() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(esame.voto, 28);
        assertEq(esame.cfu, 6);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.IN_ATTESA));
    }

    function test_RegistraEsameInsuffficiente() public {
        vm.prank(corso);
        carriera.registraEsame("Fisica I", 15, 6);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.INSUFFICIENTE));
    }

    function test_RegistraLode() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi", 31, 9);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(esame.voto, 31);
    }

    function test_RegistraEsameSenzaRuoloError() public {
        vm.prank(studente2);
        vm.expectRevert();
        carriera.registraEsame("Analisi I", 28, 6);
    }

    function test_VotoTroppoAltoError() public {
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 32, 6);
    }

    function test_CFUZeroError() public {
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 25, 0);
    }

    function test_CFUTroppoAltiError() public {
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Algebra Lineare", 25, 21);
    }

    function test_NomeVuotoError() public {
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("", 25, 6);
    }

    function test_VotoNegativoError() public {
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Analisi I", -5, 6);
    }

    function test_NumeroEsamiIncrementa() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(corso);
        carriera.registraEsame("Basi di Dati", 25, 12);
        assertEq(carriera.getNumeroEsami(), 2);
    }

    function test_DueEsamiVotiDiversi() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 10, 6);
        vm.prank(corso);
        carriera.registraEsame("Fisica I", 25, 6);

        CarrieraStudente.Esame memory primo = carriera.getEsame(0);
        CarrieraStudente.Esame memory secondo = carriera.getEsame(1);

        assertEq(uint(primo.stato), uint(CarrieraStudente.StatoEsame.INSUFFICIENTE));
        assertEq(uint(secondo.stato), uint(CarrieraStudente.StatoEsame.IN_ATTESA));
    }

    // ─── accettaEsame ────────────────────────────────────────────

    function test_StudenteAccettaEsame() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.ACCETTATO));
    }

    function test_AltroUtenteAccettaError() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente2);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    function test_AccettaEsameInsuffError() public {
        vm.prank(corso);
        carriera.registraEsame("Fisica I", 10, 6);
        vm.prank(studente1);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    function test_AccettaEsameGiaAccettatoError() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        vm.prank(studente1);
        vm.expectRevert();
        carriera.accettaEsame(0);
    }

    // ─── rifiutaEsame ────────────────────────────────────────────

    function test_StudenteRifiutaEsame() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.rifiutaEsame(0);
        CarrieraStudente.Esame memory esame = carriera.getEsame(0);
        assertEq(uint(esame.stato), uint(CarrieraStudente.StatoEsame.RIFIUTATO));
    }

    function test_AltroUtenteRifiutaError() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente2);
        vm.expectRevert();
        carriera.rifiutaEsame(0);
    }

    function test_RifiutaEsameGiaRifiutatoError() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.rifiutaEsame(0);
        vm.prank(studente1);
        vm.expectRevert();
        carriera.rifiutaEsame(0);
    }

    // ─── CFU totali ───────────────────────────────────────────────

    function test_CFUTotaliZeroSenzaAccettati() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        assertEq(carriera.getCFUTotali(), 0);
    }

    function test_CFUTotaliSoloAccettati() public {
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(corso);
        carriera.registraEsame("Fisica I", 25, 6);
        vm.prank(corso);
        carriera.registraEsame("Basi di Dati", 10, 12);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        vm.prank(studente1);
        carriera.accettaEsame(1);
        assertEq(carriera.getCFUTotali(), 12);
    }

    // ─── isLaureato ───────────────────────────────────────────────

    function test_IsLaureato_triennale() public {
        // serve 180 CFU, ne ha solo 6 → non laureato
        vm.prank(corso);
        carriera.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carriera.accettaEsame(0);
        assertEq(carriera.isLaureato(), false);
    }

    function test_IsLaureato_magistrale() public {
        CarrieraStudente carrieraMag = new CarrieraStudente(studente1, segreteria, universita, STUDENTE_ROLE, CORSO_ROLE, CarrieraStudente.TipoLaurea.MAGISTRALE, "Mario", "Rossi");
        vm.prank(segreteria);
        carrieraMag.grantRole(CORSO_ROLE, corso);
        // serve 120 CFU, ne ha solo 6 → non laureato
        vm.prank(corso);
        carrieraMag.registraEsame("Analisi I", 28, 6);
        vm.prank(studente1);
        carrieraMag.accettaEsame(0);
        assertEq(carrieraMag.isLaureato(), false);
    }

    function test_TipoLaurea_triennale() public view {
        assertEq(uint(carriera.tipoLaurea()), uint(CarrieraStudente.TipoLaurea.TRIENNALE));
    }

    function test_TipoLaurea_magistrale() public {
        CarrieraStudente carrieraMag = new CarrieraStudente(studente1, segreteria, universita, STUDENTE_ROLE, CORSO_ROLE, CarrieraStudente.TipoLaurea.MAGISTRALE, "Mario", "Rossi");
        assertEq(uint(carrieraMag.tipoLaurea()), uint(CarrieraStudente.TipoLaurea.MAGISTRALE));
    }

    // ─── nome e cognome ───────────────────────────────────────────

    function test_NomeCognomeIniziali() public view {
        assertEq(carriera.nome(), "Mario");
        assertEq(carriera.cognome(), "Rossi");
    }

    function test_AggiornaNome_daStudente() public {
        vm.prank(studente1);
        carriera.aggiornaNome("Luigi");
        assertEq(carriera.nome(), "Luigi");
    }

    function test_AggiornaCognome_daStudente() public {
        vm.prank(studente1);
        carriera.aggiornaCognome("Bianchi");
        assertEq(carriera.cognome(), "Bianchi");
    }

    function test_AggiornaNome_daSegreteria() public {
        vm.prank(segreteria);
        carriera.aggiornaNome("Giuseppe");
        assertEq(carriera.nome(), "Giuseppe");
    }

    function test_AggiornaNome_nomeVuotoError() public {
        vm.prank(studente1);
        vm.expectRevert("Il nome non puo' essere vuoto");
        carriera.aggiornaNome("");
    }

    function test_AggiornaNome_nonAutorizzatoError() public {
        vm.prank(studente2);
        vm.expectRevert("Non autorizzato");
        carriera.aggiornaNome("Hacker");
    }

    // ─── getStudenteInfo ─────────────────────────────────────────

    function test_GetStudenteInfo() public view {
        CarrieraStudente.StudenteInfo memory info = carriera.getStudenteInfo();
        assertEq(info.wallet, studente1);
        assertEq(info.nome, "Mario");
        assertEq(info.cognome, "Rossi");
        assertEq(uint(info.tipoLaurea), uint(CarrieraStudente.TipoLaurea.TRIENNALE));
        assertEq(info.cfuTotali, 0);
        assertEq(info.laureato, false);
    }
    function test_GetStudenteInfo_magistrale() public {
        CarrieraStudente carrieraMag = new CarrieraStudente(studente1, segreteria, universita, STUDENTE_ROLE, CORSO_ROLE, CarrieraStudente.TipoLaurea.MAGISTRALE, "Mario", "Rossi");
        vm.prank(segreteria);
        carrieraMag.grantRole(CORSO_ROLE, corso);

        CarrieraStudente.StudenteInfo memory info = carrieraMag.getStudenteInfo();
        assertEq(info.wallet, studente1);
        assertEq(info.nome, "Mario");
        assertEq(info.cognome, "Rossi");
        assertEq(uint(info.tipoLaurea), uint(CarrieraStudente.TipoLaurea.MAGISTRALE));
        assertEq(info.cfuTotali, 0);
        assertEq(info.laureato, false);
    }

    // ─── AccessControl ───────────────────────────────────────────

    function test_SegreteriaGrantCorsoRole() public {
        address nuovoCorso = makeAddr("nuovoCorso");
        vm.prank(segreteria);
        carriera.grantRole(CORSO_ROLE, nuovoCorso);
        assertTrue(carriera.hasRole(CORSO_ROLE, nuovoCorso));
    }

    function test_NonAdminGrantRoleError() public {
        address nuovoCorso = makeAddr("nuovoCorso");
        vm.prank(studente1);
        vm.expectRevert();
        carriera.grantRole(CORSO_ROLE, nuovoCorso);
    }

    function test_SegreteriaRevokeCorsoRole() public {
        vm.prank(segreteria);
        carriera.revokeRole(CORSO_ROLE, corso);
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Analisi I", 28, 6);
    }

    // ─── universita come admin ────────────────────────────────────

    function test_UniversitaGrantCorsoRole() public {
        address nuovoCorso = makeAddr("nuovoCorso");
        vm.prank(universita);
        carriera.grantRole(CORSO_ROLE, nuovoCorso);
        assertTrue(carriera.hasRole(CORSO_ROLE, nuovoCorso));
    }

    function test_UniversitaRevokeCorsoRole() public {
        vm.prank(universita);
        carriera.revokeRole(CORSO_ROLE, corso);
        vm.prank(corso);
        vm.expectRevert();
        carriera.registraEsame("Analisi I", 28, 6);
    }
}