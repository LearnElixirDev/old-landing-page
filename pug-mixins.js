export const pugMixins = `
mixin each(loop)
  | {#each #{loop}}
  if block
    block
  | {/each}

mixin if(condition)
  | {#if #{condition}}
  if block
    block
  | {/if}

mixin else
  | {:else}
  if block
    block

mixin await(promise)
  | {#await #{promise}}
  if block
    block
  | {/await}

mixin then(answer)
  | {:then #{answer}}
  if block
    block

mixin catch(error)
  | {:catch #{error}}
  if block
    block
`
