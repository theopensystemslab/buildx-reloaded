[1mdiff --git a/app/design/state/layouts.ts b/app/design/state/layouts.ts[m
[1mindex 059800a..e8c9a1c 100644[m
[1m--- a/app/design/state/layouts.ts[m
[1m+++ b/app/design/state/layouts.ts[m
[36m@@ -1,3 +1,4 @@[m
[32m+[m[32mimport { Module } from "@/server/data/modules"[m
 import { transpose as transposeA } from "fp-ts-std/Array"[m
 import { transpose as transposeRA } from "fp-ts-std/ReadonlyArray"[m
 import * as A from "fp-ts/Array"[m
[36m@@ -6,9 +7,7 @@[m [mimport * as RA from "fp-ts/ReadonlyArray"[m
 import produce from "immer"[m
 import { proxy, ref } from "valtio"[m
 import { usePadColumn } from "../../data/modules"[m
[31m-import { Module } from "@/server/data/modules"[m
 import { modulesToRows, useDnaModules, useHouseModules } from "./houses"[m
[31m-import { pipeLog } from "../../utils/functions"[m
 [m
 export type PositionedModule = {[m
   module: Module[m
[1mdiff --git a/app/design/ui-3d/propped/ProppedHouse.tsx b/app/design/ui-3d/propped/ProppedHouse.tsx[m
[1mindex 24eaf74..1a556e6 100644[m
[1m--- a/app/design/ui-3d/propped/ProppedHouse.tsx[m
[1m+++ b/app/design/ui-3d/propped/ProppedHouse.tsx[m
[36m@@ -22,7 +22,27 @@[m [mconst ProppedHouse = (props: Props) => {[m
   }, [dnas, houseId, systemId])[m
 [m
   useHouseLayoutEvents(houseId, (layout) => {[m
[31m-    console.log(JSON.stringify(layout))[m
[32m+[m[32m    console.log([m
[32m+[m[32m      JSON.stringify([m
[32m+[m[32m        layout.map(({ columnIndex, gridGroups, length, z }) => ({[m
[32m+[m[32m          columnIndex,[m
[32m+[m[32m          length,[m
[32m+[m[32m          z,[m
[32m+[m[32m          gridGroups: gridGroups.map([m
[32m+[m[32m            ({ length, levelIndex, levelType, modules, y }) => ({[m
[32m+[m[32m              length,[m
[32m+[m[32m              levelIndex,[m
[32m+[m[32m              levelType,[m
[32m+[m[32m              y,[m
[32m+[m[32m              modules: modules.map(({ gridGroupIndex, z }) => ({[m
[32m+[m[32m                gridGroupIndex,[m
[32m+[m[32m                z,[m
[32m+[m[32m              })),[m
[32m+[m[32m            })[m
[32m+[m[32m          ),[m
[32m+[m[32m        }))[m
[32m+[m[32m      )[m
[32m+[m[32m    )[m
   })[m
 [m
   return <group name={houseId}></group>[m
[1mdiff --git a/app/workers/systems/worker.ts b/app/workers/systems/worker.ts[m
[1mindex 9373206..758bf36 100644[m
[1m--- a/app/workers/systems/worker.ts[m
[1m+++ b/app/workers/systems/worker.ts[m
[36m@@ -6,7 +6,7 @@[m [mimport { vanillaTrpc } from "../../../client/trpc"[m
 import { Module } from "../../../server/data/modules"[m
 import systemsDB, { IndexedModule } from "../../db/systems"[m
 import { modulesToColumnLayout } from "../../design/state/layouts"[m
[31m-import { A, pipeLog, RA } from "../../utils/functions"[m
[32m+[m[32mimport { A } from "../../utils/functions"[m
 [m
 const initModules = async () => {[m
   const remoteModules = await vanillaTrpc.modules.query()[m
[36m@@ -95,7 +95,6 @@[m [mexport const computeLayout = ({ systemId, dnas }: ComputeLayoutEventDetail) => {[m
     A.filterMap((dna) =>[m
       pipe([m
         allSystemsModules,[m
[31m-        pipeLog,[m
         A.findFirst([m
           (systemModule: Module) =>[m
             systemModule.systemId === systemId && systemModule.dna === dna[m
