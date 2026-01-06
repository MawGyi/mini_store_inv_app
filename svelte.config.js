import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x',
      regions: ['iad1'],
      split: true
    }),
    alias: {
      $lib: './src/lib',
      $components: './src/lib/components'
    }
  }
}
