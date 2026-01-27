import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChessBishop,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Crown,
  Mail,
  Puzzle,
  Swords,
  User,
} from 'lucide-react'
import { LogoutButton } from './LogoutButton'

type Props = {
  email?: string | null
  name: string
  fullname?: string | null
  role: string
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  god: <Swords className="ml-1 size-5 text-blue-500" />,
  king: <Crown className="ml-1 size-5 text-purple-500" />,
  queen: <ChessQueen className="ml-1 size-5 text-sky-500" />,
  rook: <ChessRook className="ml-1 size-5 text-neutral-700" />,
  bishop: <ChessBishop className="ml-1 size-5 text-neutral-700" />,
  knight: <ChessKnight className="ml-1 size-5 text-neutral-700" />,
  pawn: <ChessPawn className="ml-1 size-5 text-neutral-700" />,
}

export const ROLE_LABEL_FA: Record<string, string> = {
  god: 'خــدا',
  king: 'شـاه',
  queen: 'وزیــر',
  rook: 'رخ',
  bishop: 'فــیل',
  knight: 'اســبــ',
  pawn: 'سربـاز',
}

export function UserProfile({ email, name, fullname, role }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-400 cursor-pointer text-neutral-700 rounded-lg"
        >
          {ROLE_ICON[role]}
          {fullname}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-gray-400 ">
        <DropdownMenuGroup>
          {name && (
            <DropdownMenuItem className="font-sans text-neutral-700 mb-1">
              <User />
              {name}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {email && (
            <DropdownMenuItem className="font-sans text-neutral-700 mb-1">
              <Mail />
              {email}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {role && (
            <DropdownMenuItem className=" text-neutral-700">
              <Puzzle />
              {ROLE_LABEL_FA[role] || role}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200 mx-1 my-2" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild dir="rtl" variant="destructive" className="cursor-pointer">
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
