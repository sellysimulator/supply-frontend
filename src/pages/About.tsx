import { ButtonLink, Card, CardBody } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'

const BOUNDARIES = [
  {
    title: 'Supply is a catalog',
    body: 'Supply holds the description of each game — what it teaches, who it is for, how long it takes — along with a link to where it runs. That is the whole of its job.',
  },
  {
    title: 'The games are independent',
    body: 'Every game in the catalog is built, deployed and maintained on its own, with its own interface, its own data and its own release schedule. Supply does not run them or store anything they produce.',
  },
  {
    title: 'Curated, not automated',
    body: 'Entries are written and reviewed by the people who maintain the catalog, so the description you read does not depend on the game being online at that moment.',
  },
]

export default function About() {
  return (
    <PageContainer>
      <PageHeading
        title="About Supply"
        description="Why this catalog exists and what it is — and is not — responsible for."
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-6 leading-relaxed text-muted-foreground lg:col-span-2">
          <p>
            Games and simulations are among the most effective ways to teach how supply chains
            behave. The Beer Game has shown for decades that a lesson about delay, information loss
            and the bullwhip effect lands far harder when people live through it than when they read
            about it.
          </p>
          <p>
            The difficulty is finding them. Educational simulations are scattered across university
            pages, research projects and independent developers, usually described in terms that
            make it hard to tell how many players are needed, how long a session runs, or what a
            group is actually meant to learn. Choosing one often means running it first.
          </p>
          <p>
            Supply exists to close that gap. It is a single place to discover supply chain games,
            read a consistent description of each, and open the one that fits. Every entry records
            the same facts in the same form — objectives, audience, group size, duration, supporting
            material — so two games can be compared without guesswork.
          </p>
          <p>
            The catalog is deliberately narrow in scope. It does not host the games, keep scores,
            manage sessions or collect anything about the people who play them. It describes and it
            links; the games themselves do the rest.
          </p>
        </div>

        <aside className="flex flex-col gap-4">
          {BOUNDARIES.map((item) => (
            <Card key={item.title}>
              <CardBody className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </CardBody>
            </Card>
          ))}
        </aside>
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground">Start with the catalog</h2>
        <p className="max-w-2xl text-muted-foreground">
          Browse everything currently published, filter by category, and open a game's details to
          see what a session involves.
        </p>
        <ButtonLink to="/catalog">Browse the catalog</ButtonLink>
      </div>
    </PageContainer>
  )
}
