import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { heroMessages, marketingBanners } from '../homeContent'
import './HomePromotions.css'

function useRotation(count, delay) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(() => document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => setReducedMotion(media.matches)
    const onVisibility = () => setHidden(document.hidden)
    media.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      media.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const rotating = count > 1 && !paused && !hovered && !focused && !hidden && !reducedMotion
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setIndex(current => (current + 1) % count), delay)
    return () => window.clearInterval(timer)
  }, [count, delay, rotating, index])

  function select(next) {
    setIndex((next + count) % count)
    setPaused(true)
  }

  return {
    index, paused, reducedMotion, rotating, select,
    toggle: () => setPaused(current => !current),
    interactions: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) },
    },
  }
}

export function AnimatedHero({ site }) {
  const messages = [site.tagline || 'Stories that entertain, inform, and inspire.', ...heroMessages]
  const rotation = useRotation(messages.length, 5000)
  return <section className="masthead animated-masthead" aria-label="Welcome" {...rotation.interactions}>
    <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
    <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
    <div className="container hero-intro">
      <span className="hero-kicker">A fresh perspective, every day</span>
      <h1>{site.siteName || 'Legit.cm'}</h1>
      <div className="hero-message-stage" aria-live="off">
        <p key={rotation.index} className="hero-message">{messages[rotation.index]}</p>
      </div>
      <div className="hero-intro-bottom">
        <a className="hero-explore" href="#latest-stories">Explore the stories <ArrowRight size={17} /></a>
        <div className="hero-message-controls" role="group" aria-label="Welcome messages">
          {messages.map((message, index) => <button key={index} type="button" className={`hero-message-dot${index === rotation.index ? ' active' : ''}`}
            aria-label={`Show message ${index + 1}: ${message}`} aria-pressed={index === rotation.index} onClick={() => rotation.select(index)} />)}
          {!rotation.reducedMotion && <button type="button" className="hero-pause" onClick={rotation.toggle} aria-label={rotation.paused ? 'Resume welcome messages' : 'Pause welcome messages'}>
            {rotation.paused ? <Play size={14} /> : <Pause size={14} />}
          </button>}
        </div>
      </div>
    </div>
  </section>
}

export function MarketingSlider() {
  const rotation = useRotation(marketingBanners.length, 6500)
  const slide = marketingBanners[rotation.index]
  return <section className="container marketing-section" aria-label="Featured promotions" aria-roledescription="carousel" {...rotation.interactions}>
    <div className="marketing-heading"><span>In the spotlight</span><span>Discover more with us</span></div>
    <div className="marketing-banner" style={{ '--banner-color': slide.color }}>
      <div key={slide.id} className="marketing-slide" role="group" aria-roledescription="slide" aria-label={`${rotation.index + 1} of ${marketingBanners.length}: ${slide.title}`}>
        <div className="marketing-art"><img src={slide.image} alt={slide.imageAlt} width="1200" height="750" /></div>
        <div className="marketing-copy">
          <span className="marketing-eyebrow">{slide.eyebrow}</span>
          <h2>{slide.title}</h2>
          <p>{slide.description}</p>
          {slide.href.startsWith('#') ? <a className="marketing-cta" href={slide.href}>{slide.action}<ArrowRight size={17} /></a>
            : <Link className="marketing-cta" to={slide.href}>{slide.action}<ArrowRight size={17} /></Link>}
        </div>
      </div>
      <div className="marketing-controls" role="group" aria-label="Promotion controls">
        <button type="button" onClick={() => rotation.select(rotation.index - 1)} aria-label="Previous promotion"><ChevronLeft size={19} /></button>
        <div className="marketing-dots">{marketingBanners.map((banner, index) => <button type="button" key={banner.id} aria-label={`Show promotion ${index + 1}: ${banner.title}`} aria-pressed={index === rotation.index}
          className={index === rotation.index ? 'active' : ''} onClick={() => rotation.select(index)} />)}</div>
        <span className="marketing-count">{String(rotation.index + 1).padStart(2, '0')} / {String(marketingBanners.length).padStart(2, '0')}</span>
        {!rotation.reducedMotion && <button type="button" onClick={rotation.toggle} aria-label={rotation.paused ? 'Resume promotions' : 'Pause promotions'}>{rotation.paused ? <Play size={15} /> : <Pause size={15} />}</button>}
        <button type="button" onClick={() => rotation.select(rotation.index + 1)} aria-label="Next promotion"><ChevronRight size={19} /></button>
      </div>
    </div>
  </section>
}
