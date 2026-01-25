import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChessKnight, Mail, User } from 'lucide-react'
import { LogoutButton } from './LogoutButton'

type Props = {
  email?: string | null
  name: string
  fullname?: string | null
}

export function UserProfile({ email, name, fullname }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-400 cursor-pointer text-neutral-700 rounded-lg"
        >
          <ChessKnight className="ml-1 size-5" />
          {fullname}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-gray-400">
        <DropdownMenuGroup>
          {name && (
            <DropdownMenuItem className="font-sans text-neutral-700">
              <User />
              {name}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {email && (
            <DropdownMenuItem className="font-sans text-neutral-700">
              <Mail />
              {email}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-400 mx-1 my-2" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild dir="rtl" variant="destructive" className="cursor-pointer">
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
