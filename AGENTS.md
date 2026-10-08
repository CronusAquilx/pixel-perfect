<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Simulator state lives in a zustand store (src/lib/store.ts) and is mirrored per user to the user_state table via src/lib/sync.ts; profiles holds public leaderboard stats exposed only through the get_leaderboard() function.
- Market data goes through the provider interface in src/lib/market.ts so a real API can replace the mock.
- AI coach streams from the /api/coach server route, which verifies the bearer token before calling the AI gateway.
- Lesson videos use CDN asset pointers and a browser-safe chapter manifest; playback and practice pauses stay local to the lesson so watching cannot place trades or award quiz XP.
