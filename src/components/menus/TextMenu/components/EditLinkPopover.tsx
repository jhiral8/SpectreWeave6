import { LinkEditorPanel } from '@/components/panels'
import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/Toolbar'
import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'

export type EditLinkPopoverProps = {
  onSetLink: (link: string, openInNewTab?: boolean) => void
}

export const EditLinkPopover = ({ onSetLink }: EditLinkPopoverProps) => {
  const [open, setOpen] = useState(false)

  const handleSetLink = (link: string, openInNewTab?: boolean) => {
    onSetLink(link, openInNewTab)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Toolbar.Button tooltip="Set Link">
          <Icon name="Link" />
        </Toolbar.Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          side="bottom" 
          align="start" 
          sideOffset={8}
          collisionPadding={8}
          avoidCollisions={true}
        >
          <LinkEditorPanel onSetLink={handleSetLink} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
