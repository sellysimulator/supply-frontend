import { Button, Modal } from './ui'

/**
 * Terms and conditions, opened from the footer. The substance the spec calls
 * for is the analytics disclosure: Supply counts game launches anonymously, in
 * hourly totals, to understand which games draw interest.
 */
export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Terms and Conditions"
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">About this catalog</h3>
          <p>
            Supply is a catalog of educational games and simulations about supply chains. It helps
            you find a game and understand what it teaches. Supply does not run the games or manage
            gameplay. Each game listed here is an independently developed and operated application,
            reached through a link from this site.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Anonymous usage analytics</h3>
          <p>
            Supply collects anonymous data about interactions with the games in this catalog for the
            purpose of trend analysis. When you open a game from this site, we record which game was
            selected and the hour in which it happened. These records are kept as hourly totals per
            game.
          </p>
          <p>
            These records do not contain your name, email address, account identifier, cookies, or
            any persistent identifier that could be used to recognise you or your device. We cannot
            link a recorded interaction back to an individual visitor, and we do not attempt to.
          </p>
          <p>
            We use these totals only to understand which games attract the most interest and when
            that interest occurs, so the catalog can be curated and improved.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Games listed in this catalog</h3>
          <p>
            Following a link to a game takes you to a separate application that is not operated by
            Supply and is governed by its own terms and its own handling of any information you
            provide to it. Supply has no access to the data those games collect or store.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Administrator sign-in</h3>
          <p>
            Signing in with Google is available only to catalog administrators and is used solely to
            authorise changes to catalog content. Visitors do not need an account to browse the
            catalog or to open a game.
          </p>
        </section>
      </div>
    </Modal>
  )
}
