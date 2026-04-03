import React from 'react';
import { CommunityFeed } from './CommunityFeed';

const CommunityPage = () => {
  // You can define different community IDs for different topics
  const communityId = "general-discussion";

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Community Discussion</h1>
        <p style={{ color: '#666' }}>
          Welcome to the general discussion board. Share your thoughts and questions here!
        </p>
      </header>
      
      <section>
        <CommunityFeed communityId={communityId} />
      </section>
    </main>
  );
};

export default CommunityPage;