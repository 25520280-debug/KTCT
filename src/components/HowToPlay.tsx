import { BookOpen, Briefcase, Coins, Factory, Keyboard, TrendingUp } from 'lucide-react'
import { CONFIG } from '../config'
import Modal from './Modal'
import MerchantSplash from './MerchantSplash'

const ICONS = [Keyboard, Briefcase, Factory, TrendingUp, Coins]

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const t = CONFIG.text.help

  return (
    <Modal width={1120} onClose={onClose}>
      <div className="flex items-center gap-5">
        <aside className="flex w-[270px] shrink-0 flex-col items-center justify-end self-stretch border-[3px] border-ink bg-teal pt-3">
          <span className="mb-2 border-[3px] border-ink bg-amber px-3 py-1 text-[16px] font-black">NHÀ TƯ BẢN</span>
          <MerchantSplash className="h-[270px] w-[190px]" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center bg-ink text-amber">
              <BookOpen size={30} strokeWidth={2.5} />
            </span>
            <h2 className="text-[27px] leading-none font-black">{t.title}</h2>
          </div>

          <p className="mt-4 text-[16px] leading-snug">{t.intro}</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {t.steps.map((step, index) => {
              const Icon = ICONS[index]
              return (
                <section key={step.title} className="border-[3px] border-ink bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center bg-ink text-amber">
                      <Icon size={19} strokeWidth={2.5} />
                    </span>
                    <h3 className="text-[17px] leading-tight font-black">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-[15px] leading-snug">{step.body}</p>
                </section>
              )
            })}
          </div>

          <section className="mt-4 border-[3px] border-ink bg-teal p-3 text-card">
            <h3 className="text-[17px] font-black tracking-wide">{t.tipLabel}</h3>
            <p className="mt-1 text-[16px] leading-snug">{t.tip}</p>
          </section>
        </div>
      </div>
    </Modal>
  )
}
