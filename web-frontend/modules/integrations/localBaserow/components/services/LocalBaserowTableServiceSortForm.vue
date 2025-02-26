<template>
  <div v-if="value">
    <div v-if="value.length === 0" class="sortings__none">
      <div class="sortings__none-title">
        {{ $t('localBaserowTableServiceSortForm.noSortTitle') }}
      </div>
      <div class="sortings__none-description">
        {{ $t('localBaserowTableServiceSortForm.noSortText') }}
      </div>
    </div>
    <div class="sortings__items">
      <div
        v-for="(sort, index) in value"
        :key="sort.id"
        class="sortings__item"
        :set="(field = getField(sort.field))"
      >
        <a
          v-if="!disableSort"
          class="sortings__remove"
          @click.stop="deleteSort(sort)"
        >
          <i class="iconoir-cancel"></i>
        </a>

        <div class="sortings__description">
          <template v-if="index === 0">{{
            $t('localBaserowTableServiceSortForm.sortBy')
          }}</template>
          <template v-if="index > 0">{{
            $t('localBaserowTableServiceSortForm.thenBy')
          }}</template>
        </div>
        <div class="sortings__field">
          <Dropdown
            :value="sort.field"
            :disabled="disableSort"
            :fixed-items="true"
            class="dropdown--floating"
            small
            @input="updateSort(sort, { field: $event })"
          >
            <DropdownItem
              v-for="field in fields"
              :key="'sort-field-' + sort.id + '-' + field.id"
              :name="field.name"
              :value="field.id"
              :disabled="sort.field !== field.id && !isFieldAvailable(field)"
            ></DropdownItem>
          </Dropdown>
        </div>
        <div
          class="sortings__order"
          :class="{ 'sortings__order--disabled': disableSort }"
        >
          <a
            class="sortings__order-item"
            :class="{ active: sort.order_by === 'ASC' }"
            @click="updateSort(sort, { order_by: 'ASC' })"
          >
            <template v-if="getSortIndicator(field, 0) === 'text'">{{
              getSortIndicator(field, 1)
            }}</template>
            <i
              v-if="getSortIndicator(field, 0) === 'icon'"
              :class="getSortIndicator(field, 1)"
            ></i>

            <i class="iconoir-arrow-right"></i>

            <template v-if="getSortIndicator(field, 0) === 'text'">{{
              getSortIndicator(field, 2)
            }}</template>
            <i
              v-if="getSortIndicator(field, 0) === 'icon'"
              :class="getSortIndicator(field, 2)"
            ></i>
          </a>
          <a
            class="sortings__order-item"
            :class="{ active: sort.order_by === 'DESC' }"
            @click="updateSort(sort, { order_by: 'DESC' })"
          >
            <template v-if="getSortIndicator(field, 0) === 'text'">{{
              getSortIndicator(field, 2)
            }}</template>
            <i
              v-if="getSortIndicator(field, 0) === 'icon'"
              :class="getSortIndicator(field, 2)"
            ></i>

            <i class="iconoir-arrow-right"></i>

            <template v-if="getSortIndicator(field, 0) === 'text'">{{
              getSortIndicator(field, 1)
            }}</template>
            <i
              v-if="getSortIndicator(field, 0) === 'icon'"
              :class="getSortIndicator(field, 1)"
            ></i>
          </a>
        </div>
      </div>
    </div>
    <template v-if="value.length < availableFieldsLength && !disableSort">
      <a
        v-if="!tableLoading"
        ref="addContextToggle"
        class="sortings__add"
        @click="
          $refs.addContext.toggle($refs.addContextToggle, 'bottom', 'left', 4)
        "
      >
        <i class="sortings__add-icon iconoir-plus"></i>
        {{ $t('localBaserowTableServiceSortForm.addSort') }}
      </a>
      <Context
        ref="addContext"
        class="sortings__add-context"
        :overflow-scroll="true"
        :max-height-if-outside-viewport="true"
      >
        <ul ref="items" class="context__menu">
          <li
            v-for="field in fields"
            v-show="isFieldAvailable(field)"
            :key="field.id"
          >
            <a @click="addSort(field)">
              <i
                class="context__menu-icon"
                :class="getFieldType(field).iconClass"
              ></i>
              {{ field.name }}
            </a>
          </li>
        </ul>
      </Context>
    </template>
  </div>
</template>

<script>
import context from '@baserow/modules/core/mixins/context'

export default {
  name: 'LocalBaserowTableServiceSortForm',
  mixins: [context],
  props: {
    value: {
      type: Array,
      required: true,
    },
    schema: {
      type: Object,
      required: true,
    },
    disableSort: {
      type: Boolean,
      required: false,
      default: false,
    },
    tableLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    /**
     * Calculates the total amount of available fields.
     */
    availableFieldsLength() {
      return this.fields.filter(this.getCanSortInView).length
    },
    fields() {
      if (this.schema === null) {
        return []
      }
      const schemaProperties =
        this.schema.type === 'array'
          ? this.schema.items.properties
          : this.schema.properties
      return Object.values(schemaProperties)
        .filter(({ metadata }) => metadata)
        .map((prop) => prop.metadata)
    },
  },
  methods: {
    getFieldType(field) {
      return this.$registry.get('field', field.type)
    },
    getCanSortInView(field) {
      return this.getFieldType(field).getCanSortInView(field)
    },
    getField(fieldId) {
      for (const i in this.fields) {
        if (this.fields[i].id === fieldId) {
          return this.fields[i]
        }
      }
      return undefined
    },
    isFieldAvailable(field) {
      const allFieldIds = this.value.map((sort) => sort.field)
      return this.getCanSortInView(field) && !allFieldIds.includes(field.id)
    },
    addSort(field) {
      this.$refs.addContext.hide()
      const newSortings = [...this.value]
      newSortings.push({
        field: field.id,
        order_by: 'ASC',
      })
      this.$emit('input', newSortings)
    },
    deleteSort(sort) {
      const newSortings = this.value.filter(({ id }) => {
        return id !== sort.id
      })
      this.$emit('input', newSortings)
    },
    updateSort(sort, values) {
      const newSortings = this.value.map((sortConf) => {
        if (sortConf.id === sort.id) {
          return { ...sortConf, ...values }
        }
        return sortConf
      })
      this.$emit('input', newSortings)
    },
    getSortIndicator(field, index) {
      return this.getFieldType(field).getSortIndicator(field, this.$registry)[
        index
      ]
    },
  },
}
</script>
