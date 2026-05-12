import React from 'react';
import MatchesClient from './MatchesClient';

export default function Page() {
  return (
    <React.Suspense fallback={<div />}> 
      <MatchesClient />
    </React.Suspense>
  );
}
