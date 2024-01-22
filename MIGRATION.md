# Migrating from v4 to v5

## Game Type IDs

The naming system used to determine the Game Type IDs have been updated in GameDig v5 and some IDs have been changed. This means you should also update your queries.

Make sure you check if your game's ID is in the table below. If not, then nothing to worry about. If it is, make sure to update. You can still use the older ID for now, but we strongly recommend that you update your queries, as older IDs will eventually not be supported anymore.

## Optional Field

| Field                      | Type    | Default   | Description                               |
|:---------------------------|:--------|:----------|:------------------------------------------|
| **checkOldIDs**            | boolean | false     | Query will check for older game type IDs. |

### Old IDs Table

| v4 |  | v5
|:---|:---|:---
| americasarmypg | → | aapg
| 7d2d | → | sdtd
| americasarmypg | → | aapg
| as | → | actionsource
| ageofchivalry | → | aoc
| arkse | → | ase
| arcasimracing | → | asr08
| arma | → | aaa
| arma2oa | → | a2oa
| armacwa | → | acwa
| armar | → | armaresistance
| armare | → | armareforger
| armagetron | → | armagetronadvanced
| bat1944 | → | battalion1944
| bf1942 | → | battlefield1942
| bfv | → | battlefieldvietnam
| bf2 | → | battlefield2
| bf2142 | → | battlefield2142
| bfbc2 | → | bbc2
| bf3 | → | battlefield3
| bf4 | → | battlefield4
| bfh | → | battlefieldhardline
| bd | → | basedefense
| bs | → | bladesymphony
| buildandshoot | → | bas
| cod4 | → | cod4mw
| callofjuarez | → | coj
| chivalry | → | cmw
| commandos3 | → | c3db
| cacrenegade | → | cacr
| contactjack | → | contractjack
| cs15 | → | counterstrike15
| cs16 | → | counterstrike16
| cs2 | → | counterstrike2
| crossracing | → | crce
| darkesthour | → | dhe4445
| daysofwar | → | dow
| deadlydozenpt | → | ddpt
| dh2005 | → | deerhunter2005
| dinodday | → | ddd
| dirttrackracing2 | → | dtr2
| dmc | → | deathmatchclassic
| dnl | → | dal
| drakan | → | dootf
| dys | → | dystopia
| em | → | empiresmod
| empyrion | → | egs
| f12002 | → | formulaone2002
| flashpointresistance | → | ofr
| fivem | → | gta5f
| forrest | → | theforrest
| graw | → | tcgraw
| graw2 | → | tcgraw2
| giantscitizenkabuto | → | gck
| ges | → | goldeneyesource
| gore | → | gus
| hldm | → | hld
| hldms | → | hlds
| hlopfor | → | hlof
| hl2dm | → | hl2d
| hidden | → | thehidden
| had2 | → | hiddendangerous2
| igi2 | → | i2cs
| il2 | → | il2sturmovik
| insurgencymic | → | imic
| isle | → | theisle
| jamesbondnightfire | → | jb007n
| jc2mp | → | jc2m
| jc3mp | → | jc3m
| kingpin | → | kloc
| kisspc | → | kpctnc
| kspdmp | → | kspd
| kzmod | → | kreedzclimbing
| left4dead | → | l4d
| left4dead2 | → | l4d2
| m2mp | → | m2m
| mohsh | → | mohaas
| mohbt | → | mohaab
| mohab | → | moha
| moh2010 | → | moh
| mohwf | → | mohw
| minecraftbe | → | mbe
| mtavc | → | gtavcmta
| mtasa | → | gtasamta
| ns | → | naturalselection
| ns2 | → | naturalselection2
| nwn | → | neverwinternights
| nwn2 | → | neverwinternights2
| nolf | → | tonolf
| nolf2 | → | nolf2asihw
| pvkii | → | pvak2
| ps | → | postscriptum
| primalcarnage | → | pce
| pc | → | projectcars
| pc2 | → | projectcars2
| prbf2 | → | prb2
| przomboid | → | projectzomboid
| quake1 | → | quake
| quake3 | → | q3a
| ragdollkungfu | → | rdkf
| r6 | → | rainbowsix
| r6roguespear | → | rs2rs
| r6ravenshield | → | rs3rs
| redorchestraost | → | roo4145
| redm | → | rdr2r
| riseofnations | → | ron
| rs2 | → | rs2v
| samp | → | gtasam
| saomp | → | gtasao
| savage2 | → | s2ats
| ss | → | serioussam
| ss2 | → | serioussam2
| ship | → | theship
| sinep | → | sinepisodes
| sonsoftheforest | → | sotf
| swbf | → | swb
| swbf2 | → | swb2
| swjk | → | swjkja
| swjk2 | → | swjk2jo
| takeonhelicopters | → | toh
| tf2 | → | teamfortress2
| terraria | → | terrariatshosck
| tribes1 | → | t1s
| ut | → | unrealtournament
| ut2003 | → | unrealtournament2003
| ut2004 | → | unrealtournament2004
| ut3 | → | unrealtournament3
| v8supercar | → | v8sc
| vcmp | → | vcm
| vs | → | vampireslayer
| wheeloftime | → | wot
| wolfenstein2009 | → | wolfenstein
| wolfensteinet | → | wet
| wurm | → | wurmunlimited