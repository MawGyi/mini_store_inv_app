import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'edge',
      regions: ['iad1']
    }),
    alias: {
      $lib: './src/lib',
      $components: './src/lib/components'
    }
  }
}
