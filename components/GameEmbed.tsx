import React from 'react'

export default function GameEmbed() {
  return (
    <div className="game-embed-wrapper">
      <div className="game-embed-header">
        <div className="game-embed-dots">
          <span style={{ backgroundColor: '#ff5f56' }} />
          <span style={{ backgroundColor: '#ffbd2e' }} />
          <span style={{ backgroundColor: '#27c93f' }} />
        </div>
        <div className="game-embed-url">glowtris.com</div>
      </div>
      <div className="game-embed-iframe-container">
        <iframe
          src="https://glowtris.com"
          className="game-embed-iframe"
          title="Glowtris Game"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}
