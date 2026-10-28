import type { AdminViewServerProps, UIFieldServerComponent } from 'payload'
import Link from 'next/link'
import { connection } from 'next/server'
import { isLocale, localePath } from '../../i18n/config'
import { customerChat, festivalReminder } from '../../lib/admin'
import { festivalPlan, PLAN_DAYS, saleCovers, saleState, shortDay } from '../../lib/admin-tools'
import { site } from '../../lib/site'
import { reminderCounts, salePresetData } from '../../server/admin-data'
import { hasRole } from '../access'
import { AdminPage, param } from './AdminPage'
import { SalePreset } from './SalePreset'

const longDay = (ymd: string) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`))
const LANG: Record<string, string> = { en: 'English', mr: 'मराठी', hi: 'हिंदी' }

/** People who asked to be reminded about one festival, each with a WhatsApp button and the message ready in their language. */
async function ReminderList({ view, festival }: { view: AdminViewServerProps; festival: { id: number; date: string; orderBy: string | null } }) {
  const payload = view.initPageResult.req.payload
  const [names, people] = await Promise.all([
    payload.findByID({ collection: 'festivals', id: festival.id, locale: 'all', depth: 0, select: { name: true, slug: true } }),
    payload.find({
      collection: 'enquiries',
      where: { and: [{ topic: { equals: 'reminder' } }, { reminder: { equals: festival.id } }] },
      sort: 'createdAt',
      limit: 500,
      depth: 0,
      select: { name: true, phone: true, locale: true },
    }),
  ])
  const name = names.name as unknown as Record<string, string | undefined>
  const slug = names.slug as unknown as string | Record<string, string | undefined>
  const slugIn = (l: string) => (typeof slug === 'string' ? slug : (slug?.[l] ?? slug?.en ?? ''))
  return (
    <section id="remind" className="tool-section" aria-labelledby="remind-title">
      <h2 id="remind-title">Reminder list: {name.en}</h2>
      <p className="tool-page__intro">
        {people.totalDocs} {people.totalDocs === 1 ? 'person' : 'people'} asked for a reminder. Each button opens WhatsApp with the message ready in their language. Send them one at a time.
      </p>
      {people.docs.length === 0 ? (
        <p className="empty-note">Nobody has asked for a reminder yet. The “Remind me” button on the festival page adds people here.</p>
      ) : (
        <ul className="tool-list">
          {people.docs.map((p) => {
            const l = isLocale(p.locale ?? undefined) ? (p.locale as 'en' | 'mr' | 'hi') : 'en'
            const message = festivalReminder({
              name: p.name,
              locale: l,
              festival: name[l] || name.en || '',
              date: festival.date,
              orderBy: festival.orderBy,
              link: `${site.url}${localePath(l, `/festivals/${slugIn(l)}`)}`,
            })
            return (
              <li key={p.id} className="tool-list__row">
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.phone} · {LANG[l]}
                  </small>
                </span>
                <a className="one-tap__btn is-whatsapp" href={customerChat(p.phone, message)} target="_blank" rel="noopener noreferrer" aria-label={`Send reminder to ${p.name} on WhatsApp`}>
                  Send on WhatsApp
                </a>
              </li>
            )
          })}
        </ul>
      )}
      <p>
        <Link href="/admin/festival-planner">Close the list</Link>
      </p>
    </section>
  )
}

/** Festival planner: the next 90 days of festivals, their deadlines, the sale and who asked for a reminder. */
export async function FestivalPlannerView(view: AdminViewServerProps) {
  await connection() // "Sale on" depends on today: render per visit, never in the prerendered shell
  const payload = view.initPageResult.req.payload
  const owner = hasRole(view.initPageResult.req.user, 'owner')
  const [festivals, reminders, preset] = owner
    ? await Promise.all([
        payload.find({ collection: 'festivals', depth: 0, limit: 200, pagination: false, select: { name: true, nextDate: true } }),
        reminderCounts(payload),
        salePresetData(payload),
      ])
    : [null, new Map<number, number>(), null]
  const plan = festivals && preset ? festivalPlan(festivals.docs, preset.today, reminders) : []
  const undated = (festivals?.docs.length ?? 0) - plan.length
  const saleFor = plan.find((f) => String(f.id) === param(view, 'sale')) ?? plan[0]
  const remind = plan.find((f) => String(f.id) === param(view, 'remind'))

  return (
    <AdminPage view={view} path="/festival-planner" title="Festival planner" roles={['owner']} intro={`Festivals in the next ${PLAN_DAYS} days, with the last day to order a parcel and to book event rangoli.`}>
      {remind && <ReminderList view={view} festival={remind} />}
      {plan.length === 0 ? (
        <p className="empty-note">
          No festivals in the next {PLAN_DAYS} days. Give a festival its next date and it shows up here. <Link href="/admin/collections/festivals">Set festival dates</Link>
        </p>
      ) : (
        <ol className="plan-list">
          {plan.map((f) => {
            const covered = preset && saleCovers(preset.sale, preset.today, f.date)
            const sale = !covered ? 'No sale yet' : saleState(preset.sale, new Date()) === 'on' ? 'Sale on' : 'Sale planned'
            return (
              <li key={f.id} className="plan-card">
                <div className="plan-card__head">
                  <h2>{f.name}</h2>
                  <p>
                    <strong>{longDay(f.date)}</strong> · {f.daysLeft === 0 ? 'today' : f.daysLeft === 1 ? 'tomorrow' : `in ${f.daysLeft} days`}
                  </p>
                </div>
                <dl className="plan-card__facts">
                  <div>
                    <dt>Order by</dt>
                    <dd className={f.orderBy ? undefined : 'is-late'}>{f.orderBy ? shortDay(f.orderBy) : 'Too late for parcels'}</dd>
                  </div>
                  <div>
                    <dt>Book event by</dt>
                    <dd className={f.bookBy ? undefined : 'is-late'}>{f.bookBy ? shortDay(f.bookBy) : 'Too late to book'}</dd>
                  </div>
                  <div>
                    <dt>Sale</dt>
                    <dd>
                      <span className={`status-chip ${covered ? 'is-done' : 'is-off'}`}>{sale}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Reminders</dt>
                    <dd>{f.reminders ? `${f.reminders} ${f.reminders === 1 ? 'person' : 'people'}` : 'None yet'}</dd>
                  </div>
                </dl>
                <div className="one-tap__links">
                  <Link className="one-tap__btn" href={`/admin/collections/festivals/${f.id}`}>
                    Set date
                  </Link>
                  <Link className="one-tap__btn" href={`/admin/festival-planner?sale=${f.id}#sale`}>
                    Start sale for {f.name}
                  </Link>
                  {f.reminders > 0 && (
                    <Link className="one-tap__btn is-whatsapp" href={`/admin/festival-planner?remind=${f.id}#remind`}>
                      Message reminder list ({f.reminders})
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {preset && (
        <section id="sale" className="tool-section" aria-labelledby="sale-title">
          <h2 id="sale-title">Festival sale{saleFor ? `: ${saleFor.name}` : ''}</h2>
          <SalePreset name={saleFor?.name} {...preset} />
        </section>
      )}
      {undated > 0 && plan.length > 0 && (
        <p className="tool-page__count">
          {undated} other {undated === 1 ? 'festival has' : 'festivals have'} no date in the next {PLAN_DAYS} days. <Link href="/admin/collections/festivals">See all festivals</Link>
        </p>
      )}
    </AdminPage>
  )
}

/** Shop settings → Festival sale: the same one-tap preset above the fields. */
export const SalePresetField: UIFieldServerComponent = async ({ payload, user }) => {
  if (!hasRole(user, 'owner')) return null
  const preset = await salePresetData(payload)
  return (
    <div className="sale-preset-field">
      <p className="field-label">Quick start</p>
      <SalePreset {...preset} reload />
    </div>
  )
}
