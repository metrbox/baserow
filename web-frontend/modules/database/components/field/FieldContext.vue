<template>
  <Context
    ref="context"
    :overflow-scroll="true"
    :max-height-if-outside-viewport="true"
  >
    <div class="context__menu-title">{{ field.name }} ({{ field.id }})</div>
    <ul class="context__menu">
      <li
        v-if="
          $hasPermission(
            'database.table.field.update',
            field,
            database.workspace.id
          )
        "
        class="context__menu-item"
      >
        <a
          ref="updateFieldContextLink"
          class="context__menu-item-link grid-view__description-options"
          @click="
            $refs.updateFieldContext.toggle(
              $refs.updateFieldContextLink,
              'bottom',
              'left',
              0
            )
          "
        >
          <i class="context__menu-item-icon iconoir-edit-pencil"></i>
          {{ $t('fieldContext.editField') }}
        </a>
        <UpdateFieldContext
          ref="updateFieldContext"
          :table="table"
          :view="view"
          :field="field"
          @update="$emit('update', $event)"
          @updated="$refs.context.hide()"
        ></UpdateFieldContext>
      </li>
      <slot></slot>
      <li
        v-if="
          !field.primary &&
          $hasPermission(
            'database.table.field.delete',
            field,
            database.workspace.id
          )
        "
        class="context__menu-item context__menu-item--with-separator"
      >
        <a
          :class="{ 'context__menu-item-link--loading': deleteLoading }"
          class="context__menu-item-link context__menu-item-link--delete"
          @click="deleteField()"
        >
          <i class="context__menu-item-icon iconoir-bin"></i>
          {{ $t('fieldContext.deleteField') }}
        </a>
      </li>
    </ul>
  </Context>
</template>

<script>
import context from '@baserow/modules/core/mixins/context'
import UpdateFieldContext from '@baserow/modules/database/components/field/UpdateFieldContext'
import { notifyIf } from '@baserow/modules/core/utils/error'

export default {
  name: 'FieldContext',
  components: {
    UpdateFieldContext,
  },
  mixins: [context],
  props: {
    database: {
      type: Object,
      required: true,
    },
    table: {
      type: Object,
      required: true,
    },
    view: {
      type: Object,
      required: true,
    },
    field: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      deleteLoading: false,
    }
  },
  methods: {
    // Allows other components to toggle the `FieldContext`
    // and then, once visible, immediately show the
    // `UpdateFieldContext` at the same time.
    showUpdateFieldContext() {
      this.$refs.updateFieldContext.toggle(
        this.$refs.updateFieldContextLink,
        'bottom',
        'left'
      )
    },
    async deleteField() {
      this.deleteLoading = true
      const { field } = this

      try {
        const { data } = await this.$store.dispatch('field/deleteCall', field)
        this.$emit('delete')
        await this.$store.dispatch('field/forceDelete', field)
        await this.$store.dispatch('field/forceUpdateFields', {
          fields: data.related_fields,
        })
        await this.$store.dispatch('toast/restore', {
          trash_item_type: 'field',
          trash_item_id: field.id,
        })
      } catch (error) {
        if (error.response && error.response.status === 404) {
          this.$emit('delete')
          await this.$store.dispatch('field/forceDelete', field)
        } else {
          notifyIf(error, 'field')
        }
      }
      this.hide()
      this.deleteLoading = false
    },
  },
}
</script>
