"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tokenStorage, api, BattleDetail } from "@/lib/api";

 export default function BattleResultPage() {
   const router = useRouter();
   const params = useParams();
   const battleId = params.id as string;

   const [battle, setBattle] = useState<BattleDetail | null>(null);
   const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showConfetti, setShowConfetti] = useState(false);

   useEffect(() => {
     const init = async () => {
       const token = tokenStorage.getAccessToken();
       if (!token) {
         router.replace("/");
         return;
       }

       try {
         const [battleData, playerData] = await Promise.all([
           api.getBattleDetail(battleId),
           api.getMe(),
         ]);

         if (!battleData || !playerData) {
           setError("Battle not found");
           return;
         }

         setBattle(battleData);
         setCurrentPlayerId(playerData.id);

         if (battleData.winner_id === playerData.id) {
           setShowConfetti(true);
         }
       } catch (err) {
         setError("Failed to load battle result");
       } finally {
         setIsLoading(false);
       }
     };

     init();
   }, [battleId, router]);

   if (isLoading) {
     return (
       <div className="min-h-screen landing-bg flex items-center justify-center">
         <div className="animate-pokeball-spin">
           <svg viewBox="0 0 40 40" className="w-16 h-16">
             <circle cx="20" cy="20" r="18" fill="#EE1515" />
             <path d="M 20 38 A 18 18 0 0 1 2 20 L 38 20 A 18 18 0 0 1 20 38" fill="white" />
             <rect x="2" y="18" width="36" height="4" fill="#2D2D2D" />
             <circle cx="20" cy="20" r="6" fill="#2D2D2D" />
             <circle cx="20" cy="20" r="4" fill="white" />
           </svg>
         </div>
       </div>
     );
   }

   if (error || !battle) {
     return (
       <div className="min-h-screen landing-bg flex items-center justify-center p-6">
         <Card className="w-full max-w-md">
           <CardContent className="pt-6 text-center">
             <p className="text-red-500 mb-4">{error || "Battle not found"}</p>
             <Button onClick={() => router.push("/dashboard")}>
               Return to Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }

   const isPlayer1 = currentPlayerId === battle.player1.id;
   const isWinner = battle.winner_id === currentPlayerId;
   const yourPokemon = isPlayer1 ? battle.player1.pokemon : battle.player2.pokemon;
   const opponentPokemon = isPlayer1 ? battle.player2.pokemon : battle.player1.pokemon;
  const opponent = isPlayer1 ? battle.player2 : battle.player1;

   let damageDealt = 0;
   let damageTaken = 0;
   let criticalHits = 0;
   let superEffectiveHits = 0;

   battle.turns.forEach((turn) => {
     if (!currentPlayerId) return;
     if (turn.player_id === currentPlayerId) {
       damageDealt += turn.damage;
       if (turn.is_critical) criticalHits++;
       if (turn.is_super_effective) superEffectiveHits++;
     } else {
       damageTaken += turn.damage;
     }
   });

  const yourFinalHp = yourPokemon.current_hp;

   return (
     <main className={`min-h-screen relative overflow-hidden ${isWinner ? "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100" : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300"}`}>
       {showConfetti && (
         <div className="fixed inset-0 pointer-events-none z-50">
           {[...Array(50)].map((_, i) => (
             <div
               key={i}
               className="absolute w-3 h-3"
               style={{
                 left: `${Math.random() * 100}%`,
                 backgroundColor: ["#EE1515", "#FFD700", "#3B4CCA", "#78C850", "#F08030"][Math.floor(Math.random() * 5)],
                 animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                 animationDelay: `${Math.random() * 0.5}s`,
                 transform: `rotate(${Math.random() * 360}deg)`,
               }}
             />
           ))}
         </div>
       )}

       <div className="max-w-2xl mx-auto px-4 py-8">
         <div className="text-center mb-8 animate-slide-in-up">
           <h1 className={`text-5xl font-bold mb-2 ${isWinner ? "text-green-600" : "text-gray-600"}`}>
             {isWinner ? "🎉 VICTORY! 🎉" : "DEFEAT"}
           </h1>
           <p className={`text-lg ${isWinner ? "text-green-600/80" : "text-gray-500"}`}>
             {isWinner
               ? "Congratulations, Trainer!"
               : "Better luck next time, Trainer."}
           </p>
         </div>

         <Card className={`mb-6 animate-slide-in-up delay-100 ${isWinner ? "bg-white" : "bg-white/80"}`}>
           <CardContent className="p-6">
             <div className="flex items-center justify-center">
               <div className="text-center">
                 <div className={`relative ${isWinner ? "" : "opacity-50 grayscale"}`}>
                   <img
                     src={yourPokemon.sprite_url}
                     alt={yourPokemon.name}
                     className={`w-32 h-32 object-contain ${isWinner ? "animate-gentle-bounce" : ""}`}
                   />
                   {isWinner && (
                     <>
                       <Sparkle className="absolute -top-2 left-0 w-5 h-5 text-yellow-400 animate-sparkle" />
                       <Sparkle className="absolute top-4 -right-4 w-4 h-4 text-yellow-400 animate-sparkle delay-200" />
                       <Sparkle className="absolute bottom-4 -left-2 w-3 h-3 text-yellow-400 animate-sparkle delay-300" />
                     </>
                   )}
                 </div>
                 <h2 className="text-xl font-bold mt-2">{yourPokemon.name}</h2>
                 <p className="text-muted-foreground">
                   Final HP: {yourFinalHp}/{yourPokemon.max_hp}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="mb-6 animate-slide-in-up delay-150">
           <CardHeader>
             <CardTitle>Battle Summary</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div className="flex justify-between py-2 border-b">
               <span className="text-muted-foreground">Opponent</span>
               <span className="font-semibold">{opponent.username} ({opponentPokemon.name})</span>
             </div>
             <div className="flex justify-between py-2 border-b">
               <span className="text-muted-foreground">Turns</span>
               <span className="font-semibold">{battle.turns.length}</span>
             </div>
             <div className="flex justify-between py-2 border-b">
               <span className="text-muted-foreground">Damage Dealt</span>
               <span className="font-semibold text-green-600">{damageDealt}</span>
             </div>
             <div className="flex justify-between py-2 border-b">
               <span className="text-muted-foreground">Damage Taken</span>
               <span className="font-semibold text-red-500">{damageTaken}</span>
             </div>
             <div className="flex justify-between py-2 border-b">
               <span className="text-muted-foreground">Critical Hits</span>
               <span className="font-semibold text-orange-500">{criticalHits}</span>
             </div>
             <div className="flex justify-between py-2">
               <span className="text-muted-foreground">Super Effective Hits</span>
               <span className="font-semibold text-yellow-500">{superEffectiveHits}</span>
             </div>
           </CardContent>
         </Card>

         <Card className={`mb-6 animate-slide-in-up delay-200 ${isWinner ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <span>📊</span>
               Stats Updated
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex justify-around">
               <div className="text-center">
                 <p className="text-sm text-muted-foreground">Wins</p>
                 <p className="text-2xl font-bold">
                   {isWinner ? (
                     <span className="text-green-600">
                       ↑ <span className="animate-count-up">+1</span>
                     </span>
                   ) : (
                     <span className="text-gray-400">—</span>
                   )}
                 </p>
               </div>
               <div className="text-center">
                 <p className="text-sm text-muted-foreground">Losses</p>
                 <p className="text-2xl font-bold">
                   {!isWinner ? (
                     <span className="text-red-500">
                       ↑ <span className="animate-count-up">+1</span>
                     </span>
                   ) : (
                     <span className="text-gray-400">—</span>
                   )}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>

         {!isWinner && (
           <Card className="mb-6 bg-blue-50 border-blue-200 animate-slide-in-up delay-250">
             <CardContent className="p-4">
               <div className="flex items-start gap-3">
                 <span className="text-2xl">💡</span>
                 <div>
                   <p className="font-semibold text-blue-800">Battle Tip</p>
                   <p className="text-sm text-blue-700">
                     {opponentPokemon.primary_type === "water" && yourPokemon.primary_type === "fire" && (
                       "Water types are strong against Fire types! Consider using a Grass type Pokémon next time."
                     )}
                     {opponentPokemon.primary_type === "fire" && yourPokemon.primary_type === "grass" && (
                       "Fire types are strong against Grass types! Consider using a Water type Pokémon next time."
                     )}
                     {opponentPokemon.primary_type === "grass" && yourPokemon.primary_type === "water" && (
                       "Grass types are strong against Water types! Consider using a Fire type Pokémon next time."
                     )}
                     {!["water", "fire", "grass"].includes(opponentPokemon.primary_type) && (
                       "Study type matchups to gain an advantage in battle!"
                     )}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}

         <div className="grid grid-cols-2 gap-4 animate-slide-in-up delay-300">
           <Link href="/dashboard">
             <Button variant="outline" className="w-full h-12">
               <span className="mr-2">🏠</span>
               Home
             </Button>
           </Link>
           <Link href="/battle/new">
             <Button className="w-full h-12 bg-gradient-to-r from-[var(--color-pokeball-red)] to-[var(--color-pokeball-dark-red)] hover:from-[var(--color-pokeball-dark-red)] hover:to-[var(--color-pokeball-red)]">
               <span className="mr-2">⚔️</span>
               Battle Again
             </Button>
           </Link>
         </div>
       </div>
     </main>
   );
 }

 function Sparkle({ className }: { className?: string }) {
   return (
     <svg viewBox="0 0 24 24" className={className} fill="currentColor">
       <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
     </svg>
   );
 }
