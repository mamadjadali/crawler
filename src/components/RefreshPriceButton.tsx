'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { useDocumentInfo } from '@payloadcms/ui'

export default function RefreshPriceButton() {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (!id) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/refresh-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Price refreshed successfully!')
        // Reload the page to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        setMessage(data.error || 'Failed to refresh price')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <Button
        onClick={handleRefresh}
        disabled={loading || !id}
        buttonStyle="secondary"
      >
        {loading ? 'Refreshing...' : 'Refresh Price'}
      </Button>
      {message && (
        <div
          style={{
            marginTop: '0.5rem',
            color: message.includes('success') ? 'green' : 'red',
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

