<template>
  <form @submit.prevent @keydown.enter.prevent>
    <FormGroup :label="$t('headingElementForm.levelTitle')">
      <Dropdown v-model="values.level" :show-search="false">
        <DropdownItem
          v-for="level in levels"
          :key="level.value"
          :name="level.name"
          :value="level.value"
        >
          {{ level.name }}
        </DropdownItem>
      </Dropdown>
    </FormGroup>
    <ApplicationBuilderFormulaInputGroup
      v-model="values.value"
      :label="$t('headingElementForm.textTitle')"
      :placeholder="$t('elementForms.textInputPlaceholder')"
      :data-providers-allowed="DATA_PROVIDERS_ALLOWED_ELEMENTS"
    />
    <FontSelector
      :default-values="defaultValues"
      :color-variables="headingColorVariables"
      @values-changed="$emit('values-changed', $event)"
    ></FontSelector>
  </form>
</template>

<script>
import ApplicationBuilderFormulaInputGroup from '@baserow/modules/builder/components/ApplicationBuilderFormulaInputGroup'
import headingElement from '@baserow/modules/builder/mixins/headingElement'
import FontSelector from '@baserow/modules/builder/components/elements/components/forms/general/settings/FontSelector'
import elementForm from '@baserow/modules/builder/mixins/elementForm'

export default {
  name: 'HeaderElementForm',
  components: {
    FontSelector,
    ApplicationBuilderFormulaInputGroup,
  },
  mixins: [elementForm, headingElement],
  data() {
    return {
      values: {
        value: '',
        level: 1,
        font_color: '',
      },
      levels: [...Array(6).keys()].map((level) => ({
        name: this.$t('headingElementForm.headingName', { level: level + 1 }),
        value: level + 1,
      })),
    }
  },
}
</script>
