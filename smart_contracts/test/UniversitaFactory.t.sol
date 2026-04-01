// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/UniversitaFactory.sol";
import "../contracts/CarrieraStudente.sol";
import {Test} from "forge-std/Test.sol";

contract UniversitaFactoryTest is Test {

    UniversitaFactory factory;
    address segreteria = makeAddr("segreteria");
    address studente1 = makeAddr("studente1");
    address studente2 = makeAddr("studente2");
    address studente3 = makeAddr("studente3");

    function setUp() public {
        factory = new UniversitaFactory(segreteria);
    }

    // crea carriera

    function test_SegreteriaCreaCarriera() public {
        vm.prank(segreteria);
        address carrieraAddr = factory.creaCarriera(studente1);
        assertTrue(carrieraAddr != address(0));
    }

    function test_CarrieraAssociataCorrettamente() public {
        vm.prank(segreteria);
        address carrieraAddr = factory.creaCarriera(studente1);
        assertEq(factory.getCarriera(studente1), carrieraAddr);
    }

    function test_NumeroStudentiIncrementa() public {
        vm.prank(segreteria);
        factory.creaCarriera(studente1);
        vm.prank(segreteria);
        factory.creaCarriera(studente2);
        assertEq(factory.numeroStudenti(), 2);
    }

    function test_studente3CreaCarrieraError() public {
        vm.prank(studente3);
        vm.expectRevert();
        factory.creaCarriera(studente1);
    }

    function test_CarriearaDoppiaError() public {
        vm.prank(segreteria);
        factory.creaCarriera(studente1);
        vm.prank(segreteria);
        vm.expectRevert();
        factory.creaCarriera(studente1);
    }

    function test_IndirizzoZeroError() public {
        vm.prank(segreteria);
        vm.expectRevert();
        factory.creaCarriera(address(0));
    }

    // get Carriera

    function test_GetCarrieraStudenteInesistenteError() public {
        vm.expectRevert();
        factory.getCarriera(studente1);
    }

    function test_CarrieraCreataAppartieneAStudente() public {
        vm.prank(segreteria);
        address carrieraAddr = factory.creaCarriera(studente1);
        CarrieraStudente carriera = CarrieraStudente(carrieraAddr);
        assertEq(carriera.studente(), studente1);
    }
}