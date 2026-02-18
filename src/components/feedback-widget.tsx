'use client'

import { useState } from 'react'
import { 
  MessageSquare, ThumbsUp, ThumbsDown, Bug, Lightbulb,
  X, Send, Loader2, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type FeedbackType = 'idea' | 'bug' | 'like' | 'dislike'

interface FeedbackOption {
  type: FeedbackType
  icon: React.ElementType
  label: string
  color: string
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { type: 'idea', icon: Lightbulb, label: 'Idea', color: 'text-yellow-500' },
  { type: 'bug', icon: Bug, label: 'Bug', color: 'text-red-500' },
  { type: 'like', icon: ThumbsUp, label: 'Love it', color: 'text-green-500' },
  { type: 'dislike', icon: ThumbsDown, label: 'Needs work', color: 'text-orange-500' },
]

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'type' | 'message' | 'done'>('type')
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const reset = () => {
    setStep('type')
    setFeedbackType(null)
    setMessage('')
    setSending(false)
  }

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type)
    // For quick reactions (like/dislike), submit immediately
    if (type === 'like' || type === 'dislike') {
      handleSubmit(type, '')
    } else {
      setStep('message')
    }
  }

  const handleSubmit = async (type: FeedbackType, msg: string) => {
    setSending(true)
    
    try {
      // In a real app, send to API
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   body: JSON.stringify({ type, message: msg, url: window.location.href })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStep('done')
      
      // Auto-close after showing success
      setTimeout(() => {
        setOpen(false)
        setTimeout(reset, 300)
      }, 1500)
    } catch (error) {
      console.error('Failed to send feedback:', error)
      setSending(false)
    }
  }

  const handleMessageSubmit = () => {
    if (!feedbackType || !message.trim()) return
    handleSubmit(feedbackType, message)
  }

  const selectedOption = FEEDBACK_OPTIONS.find(o => o.type === feedbackType)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="top">
        {step === 'type' && (
          <div className="p-4">
            <h3 className="font-semibold mb-3">Share your feedback</h3>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_OPTIONS.map((option) => (
                <Button
                  key={option.type}
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => handleTypeSelect(option.type)}
                >
                  <option.icon className={cn("h-5 w-5", option.color)} />
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Your feedback helps us improve Ontyx
            </p>
          </div>
        )}

        {step === 'message' && selectedOption && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setStep('type')}
              >
                ←
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <selectedOption.icon className={cn("h-3 w-3", selectedOption.color)} />
                {selectedOption.label}
              </Badge>
            </div>
            <Textarea
              placeholder={
                feedbackType === 'idea' 
                  ? "What feature would help you?"
                  : "What went wrong? Steps to reproduce?"
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleMessageSubmit}
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Thank you!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback has been received
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
