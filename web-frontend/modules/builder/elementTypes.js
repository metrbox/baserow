import { Registerable } from '@baserow/modules/core/registry'
import ParagraphElement from '@baserow/modules/builder/components/elements/components/ParagraphElement'
import HeadingElement from '@baserow/modules/builder/components/elements/components/HeadingElement'
import LinkElement from '@baserow/modules/builder/components/elements/components/LinkElement'
import ParagraphElementForm from '@baserow/modules/builder/components/elements/components/forms/general/ParagraphElementForm'
import HeadingElementForm from '@baserow/modules/builder/components/elements/components/forms/general/HeadingElementForm'
import LinkElementForm from '@baserow/modules/builder/components/elements/components/forms/general/LinkElementForm'
import ImageElementForm from '@baserow/modules/builder/components/elements/components/forms/general/ImageElementForm'
import ImageElement from '@baserow/modules/builder/components/elements/components/ImageElement'
import InputTextElement from '@baserow/modules/builder/components/elements/components/InputTextElement.vue'
import InputTextElementForm from '@baserow/modules/builder/components/elements/components/forms/general/InputTextElementForm.vue'
import TableElement from '@baserow/modules/builder/components/elements/components/TableElement.vue'
import TableElementForm from '@baserow/modules/builder/components/elements/components/forms/general/TableElementForm.vue'

import { ELEMENT_EVENTS } from '@baserow/modules/builder/enums'
import { ensureBoolean } from '@baserow/modules/core/utils/validator'
import ColumnElement from '@baserow/modules/builder/components/elements/components/ColumnElement'
import ColumnElementForm from '@baserow/modules/builder/components/elements/components/forms/general/ColumnElementForm'
import _ from 'lodash'
import DefaultStyleForm from '@baserow/modules/builder/components/elements/components/forms/style/DefaultStyleForm'
import ButtonElement from '@baserow/modules/builder/components/elements/components/ButtonElement'
import ButtonElementForm from '@baserow/modules/builder/components/elements/components/forms/general/ButtonElementForm'
import { ClickEvent, SubmitEvent } from '@baserow/modules/builder/eventTypes'
import RuntimeFormulaContext from '@baserow/modules/core/runtimeFormulaContext'
import { resolveFormula } from '@baserow/modules/core/formula'
import FormContainerElement from '@baserow/modules/builder/components/elements/components/FormContainerElement.vue'
import FormContainerElementForm from '@baserow/modules/builder/components/elements/components/forms/general/FormContainerElementForm.vue'
import DropdownElement from '@baserow/modules/builder/components/elements/components/DropdownElement.vue'
import DropdownElementForm from '@baserow/modules/builder/components/elements/components/forms/general/DropdownElementForm.vue'
import CheckboxElement from '@baserow/modules/builder/components/elements/components/CheckboxElement.vue'
import CheckboxElementForm from '@baserow/modules/builder/components/elements/components/forms/general/CheckboxElementForm.vue'

export class ElementType extends Registerable {
  get name() {
    return null
  }

  get description() {
    return null
  }

  get iconClass() {
    return null
  }

  get component() {
    return null
  }

  get editComponent() {
    return this.component
  }

  get generalFormComponent() {
    return null
  }

  get styleFormComponent() {
    return DefaultStyleForm
  }

  get stylesAll() {
    return [
      'style_padding_top',
      'style_padding_bottom',
      'style_padding_left',
      'style_padding_right',
      'style_border_top',
      'style_border_bottom',
      'style_border_left',
      'style_border_right',
      'style_background',
      'style_background_color',
      'style_width',
    ]
  }

  get styles() {
    return this.stylesAll
  }

  get events() {
    return []
  }

  getEvents() {
    return this.events.map((EventType) => new EventType(this.app))
  }

  /**
   * Returns whether the element configuration is valid or not.
   * @param {object} param An object containing the element and the builder
   * @returns true if the element is in error
   */
  isInError({ element, builder }) {
    return false
  }

  /**
   * Allow to hook into default values for this element type at element creation.
   * @param {object} values the current values for the element to create.
   * @returns an object containing values updated with the default values.
   */
  getDefaultValues(page, values) {
    // By default if an element is inside a container we apply the
    // `.getDefaultChildValues()` method of the parent to it.
    if (values?.parent_element_id) {
      const parentElement = this.app.store.getters['element/getElementById'](
        page,
        values.parent_element_id
      )
      const parentElementType = this.app.$registry.get(
        'element',
        parentElement.type
      )
      return {
        ...values,
        ...parentElementType.getDefaultChildValues(page, values),
      }
    }
    return values
  }

  onElementEvent(event, params) {}

  resolveFormula(formula, applicationContext) {
    const formulaFunctions = {
      get: (name) => {
        return this.app.$registry.get('runtimeFormulaFunction', name)
      },
    }

    const runtimeFormulaContext = new Proxy(
      new RuntimeFormulaContext(
        this.app.$registry.getAll('builderDataProvider'),
        applicationContext
      ),
      {
        get(target, prop) {
          return target.get(prop)
        },
      }
    )

    return resolveFormula(formula, formulaFunctions, runtimeFormulaContext)
  }

  /**
   * A hook that is triggered right after an element is created.
   *
   * @param element - The element that was just created
   * @param page - The page the element belongs to
   */
  afterCreate(element, page) {}

  /**
   * A hook that is triggered right after an element is deleted.
   *
   * @param element - The element that was just deleted
   * @param page - The page the element belongs to
   */
  afterDelete(element, page) {}

  /**
   * A hook that is trigger right after an element has been updated.
   * @param element - The updated element
   * @param page - The page the element belong to
   */
  afterUpdate(element, page) {}
}

export class ContainerElementType extends ElementType {
  get elementTypesAll() {
    return Object.values(this.app.$registry.getAll('element'))
  }

  /**
   * Returns an array of element types that are not allowed as children of this element.
   *
   * @returns {Array}
   */
  get childElementTypesForbidden() {
    return []
  }

  get childElementTypes() {
    return _.difference(this.elementTypesAll, this.childElementTypesForbidden)
  }

  /**
   * Returns an array of style types that are not allowed as children of this element.
   * @returns {Array}
   */
  get childStylesForbidden() {
    return []
  }

  get defaultPlaceInContainer() {
    throw new Error('Not implemented')
  }

  /**
   * Returns the default value when creating a child element to this container.
   * @param {Object} page The current page object
   * @param {Object} values The values of the to be created element
   * @returns the default values for this element.
   */
  getDefaultChildValues(page, values) {
    // By default an element inside a container should have no left and right padding
    return { style_padding_left: 0, style_padding_right: 0 }
  }
}

export class ColumnElementType extends ContainerElementType {
  getType() {
    return 'column'
  }

  get name() {
    return this.app.i18n.t('elementType.column')
  }

  get description() {
    return this.app.i18n.t('elementType.columnDescription')
  }

  get iconClass() {
    return 'iconoir-view-columns-3'
  }

  get component() {
    return ColumnElement
  }

  get generalFormComponent() {
    return ColumnElementForm
  }

  get childElementTypesForbidden() {
    return this.elementTypesAll.filter(
      (elementType) => elementType instanceof ContainerElementType
    )
  }

  get childStylesForbidden() {
    return ['style_width']
  }

  get defaultPlaceInContainer() {
    return '0'
  }
}

/**
 * This class servers as a parent class for all form element types. Form element types
 * are all elements that can be used as part of a form. So in simple terms, any element
 * that can represents data in a way that is directly modifiable by an application user.
 */
export class FormElementType extends ElementType {
  isFormElement = true

  get formDataType() {
    return null
  }

  /**
   * Get the initial form data value of an element.
   * @param element - The form element
   * @param applicationContext - The context of the current application
   * @returns {any} - The initial data that's supposed to be stored
   */
  getInitialFormDataValue(element, applicationContext) {
    throw new Error('.getInitialFormData needs to be implemented')
  }

  /**
   * This name is used by the data explorer to show the form element.
   *
   * @param element - The form element instance
   * @param applicationContext - The context of the current application
   * @returns {string} - The name of the form element
   */
  getFormDataName(element, applicationContext) {
    if (element.label) {
      return this.resolveFormula(element.label, applicationContext)
    }

    return this.generateFromDataName(element, applicationContext)
  }

  generateFromDataName(element, applicationContext) {
    const elementPosition = this.app.store.getters[
      'element/getElementPosition'
    ](applicationContext.page, element, true)
    return `${this.name} ${elementPosition}`
  }

  afterCreate(element, page) {
    const payload = {
      value: this.getInitialFormDataValue(element, { page }),
      type: this.formDataType,
    }

    return this.app.store.dispatch('formData/setFormData', {
      page,
      payload,
      elementId: element.id,
    })
  }

  afterDelete(element, page) {
    return this.app.store.dispatch('formData/removeFormData', {
      page,
      elementId: element.id,
    })
  }
}

export class InputTextElementType extends FormElementType {
  getType() {
    return 'input_text'
  }

  get name() {
    return this.app.i18n.t('elementType.inputText')
  }

  get description() {
    return this.app.i18n.t('elementType.inputTextDescription')
  }

  get iconClass() {
    return 'iconoir-input-field'
  }

  get component() {
    return InputTextElement
  }

  get generalFormComponent() {
    return InputTextElementForm
  }

  get formDataType() {
    return 'string'
  }

  getInitialFormDataValue(element, applicationContext) {
    return this.resolveFormula(element.default_value, {
      element,
      ...applicationContext,
    })
  }
}

export class HeadingElementType extends ElementType {
  static getType() {
    return 'heading'
  }

  get name() {
    return this.app.i18n.t('elementType.heading')
  }

  get description() {
    return this.app.i18n.t('elementType.headingDescription')
  }

  get iconClass() {
    return 'iconoir-text'
  }

  get component() {
    return HeadingElement
  }

  get generalFormComponent() {
    return HeadingElementForm
  }
}

export class ParagraphElementType extends ElementType {
  static getType() {
    return 'paragraph'
  }

  get name() {
    return this.app.i18n.t('elementType.paragraph')
  }

  get description() {
    return this.app.i18n.t('elementType.paragraphDescription')
  }

  get iconClass() {
    return 'iconoir-text-box'
  }

  get component() {
    return ParagraphElement
  }

  get generalFormComponent() {
    return ParagraphElementForm
  }
}

export class LinkElementType extends ElementType {
  static getType() {
    return 'link'
  }

  get name() {
    return this.app.i18n.t('elementType.link')
  }

  get description() {
    return this.app.i18n.t('elementType.linkDescription')
  }

  get iconClass() {
    return 'iconoir-link'
  }

  get component() {
    return LinkElement
  }

  get generalFormComponent() {
    return LinkElementForm
  }

  isInError({ element, builder }) {
    return LinkElementType.arePathParametersInError(element, builder)
  }

  static arePathParametersInError(element, builder) {
    if (
      element.navigation_type === 'page' &&
      !isNaN(element.navigate_to_page_id)
    ) {
      const destinationPage = builder.pages.find(
        ({ id }) => id === element.navigate_to_page_id
      )

      if (destinationPage) {
        const destinationPageParams = destinationPage.path_params || []
        const pageParams = element.page_parameters || []

        const destinationPageParamNames = destinationPageParams.map(
          ({ name }) => name
        )
        const pageParamNames = pageParams.map(({ name }) => name)

        if (!_.isEqual(destinationPageParamNames, pageParamNames)) {
          return true
        }
      }
    } //

    return false
  }
}

export class ImageElementType extends ElementType {
  getType() {
    return 'image'
  }

  get name() {
    return this.app.i18n.t('elementType.image')
  }

  get description() {
    return this.app.i18n.t('elementType.imageDescription')
  }

  get iconClass() {
    return 'iconoir-media-image'
  }

  get component() {
    return ImageElement
  }

  get generalFormComponent() {
    return ImageElementForm
  }
}

export class ButtonElementType extends ElementType {
  getType() {
    return 'button'
  }

  get name() {
    return this.app.i18n.t('elementType.button')
  }

  get description() {
    return this.app.i18n.t('elementType.buttonDescription')
  }

  get iconClass() {
    return 'iconoir-square-cursor'
  }

  get component() {
    return ButtonElement
  }

  get generalFormComponent() {
    return ButtonElementForm
  }

  get events() {
    return [ClickEvent]
  }
}

export class TableElementType extends ElementType {
  getType() {
    return 'table'
  }

  get name() {
    return this.app.i18n.t('elementType.table')
  }

  get description() {
    return this.app.i18n.t('elementType.tableDescription')
  }

  get iconClass() {
    return 'iconoir-table'
  }

  get component() {
    return TableElement
  }

  get generalFormComponent() {
    return TableElementForm
  }

  async onElementEvent(event, { page, element, dataSourceId }) {
    if (event === ELEMENT_EVENTS.DATA_SOURCE_REMOVED) {
      if (element.data_source_id === dataSourceId) {
        // Remove the data_source_id
        await this.app.store.dispatch('element/forceUpdate', {
          page,
          element,
          values: { data_source_id: null },
        })
        // Empty the element content
        await this.app.store.dispatch('elementContent/clearElementContent', {
          element,
        })
      }
    }
    if (event === ELEMENT_EVENTS.DATA_SOURCE_AFTER_UPDATE) {
      if (element.data_source_id === dataSourceId) {
        await this.app.store.dispatch(
          'elementContent/triggerElementContentReset',
          {
            element,
          }
        )
      }
    }
  }
}

export class DropdownElementType extends FormElementType {
  static getType() {
    return 'dropdown'
  }

  get name() {
    return this.app.i18n.t('elementType.dropdown')
  }

  get description() {
    return this.app.i18n.t('elementType.dropdownDescription')
  }

  get iconClass() {
    return 'iconoir-list-select'
  }

  get component() {
    return DropdownElement
  }

  get generalFormComponent() {
    return DropdownElementForm
  }

  get formDataType() {
    return 'string'
  }

  getInitialFormDataValue(element, applicationContext) {
    return this.resolveFormula(element.default_value, {
      element,
      ...applicationContext,
    })
  }
}

export class FormContainerElementType extends ContainerElementType {
  static getType() {
    return 'form_container'
  }

  get name() {
    return this.app.i18n.t('elementType.formContainer')
  }

  get description() {
    return this.app.i18n.t('elementType.formContainerDescription')
  }

  get iconClass() {
    return 'iconoir-frame'
  }

  get component() {
    return FormContainerElement
  }

  get generalFormComponent() {
    return FormContainerElementForm
  }

  get childElementTypesForbidden() {
    return this.elementTypesAll.filter((type) => !type.isFormElement)
  }

  get events() {
    return [SubmitEvent]
  }

  get childStylesForbidden() {
    return ['style_width']
  }
}

export class CheckboxElementType extends FormElementType {
  getType() {
    return 'checkbox'
  }

  get name() {
    return this.app.i18n.t('elementType.checkbox')
  }

  get description() {
    return this.app.i18n.t('elementType.checkboxDescription')
  }

  get iconClass() {
    return 'iconoir-check'
  }

  get component() {
    return CheckboxElement
  }

  get generalFormComponent() {
    return CheckboxElementForm
  }

  get formDataType() {
    return 'boolean'
  }

  getInitialFormDataValue(element, applicationContext) {
    try {
      return ensureBoolean(
        this.resolveFormula(element.default_value, {
          element,
          ...applicationContext,
        })
      )
    } catch {
      return false
    }
  }
}
