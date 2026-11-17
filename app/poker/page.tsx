import { PokerProvider } from '@/app/games/poker/lib/providers/poker-provider';
import PokerTable from '@/app/games/poker/components/poker-table';
import GameScreen from '@/app/ui/game-screen';

export default function PokerPage() {
    return (
        <GameScreen>
            <PokerProvider>
                <PokerTable />
            </PokerProvider>
        </GameScreen>
    );
}
