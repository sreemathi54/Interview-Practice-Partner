import React from 'react'

/**
 * RoleSelection Component
 * Allows user to select a job role for the interview
 * 
 * @param {function} onRoleSelect - Callback when a role is selected
 * @param {boolean} disabled - Whether selection is disabled
 */
const RoleSelection = ({ onRoleSelect, disabled = false }) => {
  const roles = [
    { id: 'engineer', name: 'Software Engineer', icon: '💻', description: 'Technical coding interviews' },
    { id: 'sales', name: 'Sales Representative', icon: '📊', description: 'Sales and negotiation skills' },
    { id: 'retail', name: 'Retail Associate', icon: '🛍️', description: 'Customer service and retail' }
  ]

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Select Your Interview Role
      </h2>
      <p className="text-slate-300 text-center mb-6">
        Choose the role you're preparing for to get tailored interview questions
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onRoleSelect(role.id)}
            disabled={disabled}
            className={`
              p-6 rounded-2xl border transition-all duration-300
              text-left transform hover:-translate-y-1
              ${disabled 
                ? 'opacity-40 cursor-not-allowed border-white/10 bg-white/5'
                : 'border-white/15 bg-white/5 hover:border-cyan-400/40 hover:bg-white/15 shadow-lg shadow-black/40 cursor-pointer'
              }
            `}
          >
            <div className="text-4xl mb-3">{role.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {role.name}
            </h3>
            <p className="text-sm text-slate-300">
              {role.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RoleSelection

