# Agent Note: LF line endings for reproducible market artifacts

Status: implemented

## Problem

`skins/endfield-baker/patches.css` reached `main` in the #66 merge with CRLF line
endings in its blob, although `.gitattributes` declares `* text=auto eol=lf` and
its own comment says text files use LF in the repository and in the working tree.
Two other files under `skins/` carry CRLF, but both are `*.svg`, which the same
file declares `binary`, so they are stored verbatim and round-trip unchanged. The
stylesheet is the only text file affected.

The asymmetry is invisible here and breaks a consumer. dsh-web pins this
repository's commit as a gitlink, rebuilds `market/dist` from the pinned content,
and verifies the committed artifacts by rebuilding into a temporary directory and
comparing sha256 per file. The rebuild reads CRLF from the pinned tarball and
writes CRLF into `dist`; a fresh checkout of `dist` gets LF from `.gitattributes`;
the two never match, so `market:check` fails in the deploy lane and the Workshop
stops updating - for a difference of zero visible bytes.

## Decision

The stylesheet is normalized to LF with `git add --renormalize`, in a commit whose
only change is 2607 line endings. `git diff --ignore-cr-at-eol` against the parent
is empty, so no declaration, selector or value moves.

The invariant belongs at the content source. `.gitattributes` already promises LF
in both the repository and the working tree; a CRLF blob breaks that promise, and
the market build is entitled to assume it holds. Restoring the file restores the
promise for every consumer instead of teaching one consumer to tolerate a broken
input.

## Alternatives considered

**Normalize line endings inside dsh-web's `scripts/market-build`.** It would make
the consumer tolerant of any input, but it changes a shared build script for one
stray file, alters how every other pinned input is written, and leaves this
repository's own promise unenforced - the next CRLF commit would still be wrong
here.

**Mark `*.css` as `binary` in `.gitattributes`.** That stops git normalizing the
stylesheet, at the cost of giving up diffs, merge handling and the LF policy for
every stylesheet in the repository.

**Revert or re-cut the #66 merge.** The skin content is fine; only the byte
encoding of one file is wrong. Reverting would drop a reviewed and accepted skin
to fix a line ending.

## Consequences

`market:check` compares equal again, so the dsh-web pin for this commit can be
promoted and the Workshop resumes updating. A contributor whose editor writes
CRLF now gets a whitespace-only diff in review instead of a silently broken
deploy lane, which is the failure mode to prefer: it is visible in the pull
request.

Nothing in this repository's CI compares a file against the working-tree form a
fresh clone produces, so the check stays manual. The deploy lane in dsh-web is the
backstop that surfaces it, and a future round that adds text assets should watch
for it before pinning.
