'use client'

import { useFormStatus } from 'react-dom'
import Link from 'next/link'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#E4002B] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  )
}

type RestaurantDefaults = {
  name?: string
  city?: string
  country?: string
  michelin_stars?: number
  green_stars?: boolean
  dietary_option?: string | null
  description?: string | null
}

interface RestaurantFormProps {
  action: (formData: FormData) => Promise<void>
  defaultValues?: RestaurantDefaults
  submitLabel: string
}

export default function RestaurantForm({ action, defaultValues, submitLabel }: RestaurantFormProps) {
  const stars = defaultValues?.michelin_stars ?? 0

  return (
    <form action={action} className="space-y-6 max-w-xl">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
          Nom <span className="text-[#E4002B]">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="Le Grand Restaurant"
          className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      {/* City + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
            Ville <span className="text-[#E4002B]">*</span>
          </label>
          <input
            name="city"
            required
            defaultValue={defaultValues?.city}
            placeholder="Paris"
            className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
            Pays <span className="text-[#E4002B]">*</span>
          </label>
          <input
            name="country"
            required
            defaultValue={defaultValues?.country}
            placeholder="France"
            className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      {/* Michelin Stars */}
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-2.5 uppercase tracking-wide">
          Étoiles Michelin
        </label>
        <div className="flex gap-3">
          {([0, 1, 2, 3] as const).map((n) => (
            <label
              key={n}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="michelin_stars"
                value={n}
                defaultChecked={stars === n}
                className="accent-[#E4002B] w-4 h-4"
              />
              <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                {n === 0 ? 'Aucune' : <span className="text-amber-400">{'★'.repeat(n)}</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Green Star */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="green_stars"
          value="true"
          id="green_stars"
          defaultChecked={defaultValues?.green_stars ?? false}
          className="accent-green-500 w-4 h-4 cursor-pointer"
        />
        <label htmlFor="green_stars" className="text-sm text-white/70 cursor-pointer hover:text-white transition-colors">
          🌿 Étoile Verte
        </label>
      </div>

      {/* Dietary Option */}
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
          Option diététique
        </label>
        <select
          name="dietary_option"
          defaultValue={defaultValues?.dietary_option ?? ''}
          className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
        >
          <option value="">Aucune</option>
          <option value="vegan">Vegan</option>
          <option value="veggie">Veggie</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Décrivez la cuisine, l'ambiance et la philosophie du restaurant…"
          className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/restaurants" className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white transition-colors">
          Annuler
        </Link>
      </div>
    </form>
  )
}
