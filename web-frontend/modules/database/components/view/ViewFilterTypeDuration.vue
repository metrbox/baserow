<template>
  <input
    ref="input"
    v-model="formattedValue"
    :placeholder="field.duration_format"
    type="text"
    class="input filters__value-input input--small"
    :class="{ 'input--error': $v.formattedValue.$error }"
    :disabled="disabled"
    @blur="updateFormattedValue(field, copy)"
    @keypress="onKeyPress(field, $event)"
    @keyup="setCopyAndDelayedUpdate($event.target.value)"
    @keydown.enter="setCopyAndDelayedUpdate($event.target.value, true)"
  />
</template>

<script>
import filterTypeInput from '@baserow/modules/database/mixins/filterTypeInput'
import durationField from '@baserow/modules/database/mixins/durationField'

export default {
  name: 'ViewFilterTypeDuration',
  mixins: [filterTypeInput, durationField],
  created() {
    this.updateCopy(this.field, this.filter.value)
    this.updateFormattedValue(this.field, this.filter.value)
  },
  methods: {
    isInputValid() {
      return !this.$v.formattedValue.$error
    },
    focus() {
      this.$refs.input.focus()
    },
    afterValueChanged(value, oldValue) {
      this.updateFormattedValue(this.field, value)
    },
    setCopyAndDelayedUpdate(value, immediately = false) {
      const newValue = this.updateCopy(this.field, value)
      if (newValue !== undefined) {
        this.delayedUpdate(this.copy, immediately)
      }
    },
    getValidationError(value) {
      const fieldType = this.$registry.get('field', this.field.type)
      return fieldType.getValidationError(this.field, value)
    },
  },
  validations: {
    copy: {},
    formattedValue: {
      isValid(value) {
        return this.getValidationError(value) === null
      },
    },
  },
}
</script>
