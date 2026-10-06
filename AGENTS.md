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

- Event share links use the immutable `events.public_token`; internal event IDs never appear in shared URLs, preserving an opaque authenticated access boundary.
- Attendance rows retain name and phone snapshots even when linked to a reusable participant, so later participant edits never rewrite event history.
