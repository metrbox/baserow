<template>
  <div>
    <PageElement
      v-for="element in elements"
      :key="element.id"
      :element="element"
      :mode="mode"
    />
  </div>
</template>

<script>
import PageElement from '@baserow/modules/builder/components/page/PageElement'

export default {
  components: { PageElement },
  inject: ['builder', 'mode'],
  props: {
    page: {
      type: Object,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    params: {
      type: Object,
      required: true,
    },
    elements: {
      type: Array,
      required: true,
    },
  },
}
</script>
