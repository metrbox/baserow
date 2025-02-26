import en from '@baserow/modules/builder/locales/en.json'
import fr from '@baserow/modules/builder/locales/fr.json'
import nl from '@baserow/modules/builder/locales/nl.json'
import de from '@baserow/modules/builder/locales/de.json'
import es from '@baserow/modules/builder/locales/es.json'
import it from '@baserow/modules/builder/locales/it.json'
import pl from '@baserow/modules/builder/locales/pl.json'
import {
  DomainsBuilderSettingsType,
  IntegrationsBuilderSettingsType,
  ThemeBuilderSettingsType,
  UserSourcesBuilderSettingsType,
} from '@baserow/modules/builder/builderSettingTypes'

import pageStore from '@baserow/modules/builder/store/page'
import elementStore from '@baserow/modules/builder/store/element'
import domainStore from '@baserow/modules/builder/store/domain'
import publicBuilderStore from '@baserow/modules/builder/store/publicBuilder'
import dataSourceStore from '@baserow/modules/builder/store/dataSource'
import pageParameterStore from '@baserow/modules/builder/store/pageParameter'
import dataSourceContentStore from '@baserow/modules/builder/store/dataSourceContent'
import elementContentStore from '@baserow/modules/builder/store/elementContent'
import themeStore from '@baserow/modules/builder/store/theme'
import workflowActionStore from '@baserow/modules/builder/store/workflowAction'
import formDataStore from '@baserow/modules/builder/store/formData'

import { registerRealtimeEvents } from '@baserow/modules/builder/realtime'
import {
  HeadingElementType,
  ImageElementType,
  ParagraphElementType,
  LinkElementType,
  InputTextElementType,
  ColumnElementType,
  ButtonElementType,
  TableElementType,
  FormContainerElementType,
  DropdownElementType,
  CheckboxElementType,
} from '@baserow/modules/builder/elementTypes'
import {
  DesktopDeviceType,
  SmartphoneDeviceType,
  TabletDeviceType,
} from '@baserow/modules/builder/deviceTypes'
import { DuplicatePageJobType } from '@baserow/modules/builder/jobTypes'
import { BuilderApplicationType } from '@baserow/modules/builder/applicationTypes'
import { PublicSiteErrorPageType } from '@baserow/modules/builder/errorPageTypes'
import {
  DataSourcesPageHeaderItemType,
  ElementsPageHeaderItemType,
  SettingsPageHeaderItemType,
} from '@baserow/modules/builder/pageHeaderItemTypes'
import {
  EventsPageSidePanelType,
  GeneralPageSidePanelType,
  StylePageSidePanelType,
} from '@baserow/modules/builder/pageSidePanelTypes'
import {
  CustomDomainType,
  SubDomainType,
} from '@baserow/modules/builder/domainTypes'
import { PagePageSettingsType } from '@baserow/modules/builder/pageSettingsTypes'
import {
  TextPathParamType,
  NumericPathParamType,
} from '@baserow/modules/builder/pathParamTypes'

import {
  PreviewPageActionType,
  PublishPageActionType,
} from '@baserow/modules/builder/pageActionTypes'

import {
  PageParameterDataProviderType,
  DataSourceDataProviderType,
  CurrentRecordDataProviderType,
  FormDataProviderType,
} from '@baserow/modules/builder/dataProviderTypes'

import { MainThemeConfigBlock } from '@baserow/modules/builder/themeConfigBlockTypes'
import {
  CreateRowWorkflowActionType,
  NotificationWorkflowActionType,
  OpenPageWorkflowActionType,
  UpdateRowWorkflowActionType,
} from '@baserow/modules/builder/workflowActionTypes'

import {
  TextCollectionFieldType,
  LinkCollectionFieldType,
} from '@baserow/modules/builder/collectionFieldTypes'

export default (context) => {
  const { store, app, isDev } = context

  if (!app.$featureFlagIsEnabled('builder')) {
    return
  }

  // Allow locale file hot reloading in dev
  if (isDev && app.i18n) {
    const { i18n } = app
    i18n.mergeLocaleMessage('en', en)
    i18n.mergeLocaleMessage('fr', fr)
    i18n.mergeLocaleMessage('nl', nl)
    i18n.mergeLocaleMessage('de', de)
    i18n.mergeLocaleMessage('es', es)
    i18n.mergeLocaleMessage('it', it)
    i18n.mergeLocaleMessage('pl', pl)
  }

  registerRealtimeEvents(app.$realtime)

  store.registerModule('page', pageStore)
  store.registerModule('element', elementStore)
  store.registerModule('domain', domainStore)
  store.registerModule('publicBuilder', publicBuilderStore)
  store.registerModule('dataSource', dataSourceStore)
  store.registerModule('pageParameter', pageParameterStore)
  store.registerModule('dataSourceContent', dataSourceContentStore)
  store.registerModule('elementContent', elementContentStore)
  store.registerModule('theme', themeStore)
  store.registerModule('workflowAction', workflowActionStore)
  store.registerModule('formData', formDataStore)

  app.$registry.registerNamespace('builderSettings')
  app.$registry.registerNamespace('element')
  app.$registry.registerNamespace('device')
  app.$registry.registerNamespace('pageHeaderItem')
  app.$registry.registerNamespace('domain')
  app.$registry.registerNamespace('pageSettings')
  app.$registry.registerNamespace('pathParamType')
  app.$registry.registerNamespace('builderDataProvider')
  app.$registry.registerNamespace('themeConfigBlock')

  app.$registry.register('application', new BuilderApplicationType(context))
  app.$registry.register('job', new DuplicatePageJobType(context))

  app.$registry.register(
    'builderSettings',
    new IntegrationsBuilderSettingsType(context)
  )
  app.$registry.register(
    'builderSettings',
    new ThemeBuilderSettingsType(context)
  )
  app.$registry.register(
    'builderSettings',
    new DomainsBuilderSettingsType(context)
  )
  app.$registry.register(
    'builderSettings',
    new UserSourcesBuilderSettingsType(context)
  )

  app.$registry.register('errorPage', new PublicSiteErrorPageType(context))

  app.$registry.register('element', new HeadingElementType(context))
  app.$registry.register('element', new ParagraphElementType(context))
  app.$registry.register('element', new LinkElementType(context))
  app.$registry.register('element', new ImageElementType(context))
  app.$registry.register('element', new InputTextElementType(context))
  app.$registry.register('element', new ColumnElementType(context))
  app.$registry.register('element', new ButtonElementType(context))
  app.$registry.register('element', new TableElementType(context))
  app.$registry.register('element', new FormContainerElementType(context))
  app.$registry.register('element', new DropdownElementType(context))
  app.$registry.register('element', new CheckboxElementType(context))

  app.$registry.register('device', new DesktopDeviceType(context))
  app.$registry.register('device', new TabletDeviceType(context))
  app.$registry.register('device', new SmartphoneDeviceType(context))

  app.$registry.register(
    'pageHeaderItem',
    new ElementsPageHeaderItemType(context)
  )
  app.$registry.register(
    'pageHeaderItem',
    new DataSourcesPageHeaderItemType(context)
  )
  app.$registry.register(
    'pageHeaderItem',
    new SettingsPageHeaderItemType(context)
  )
  app.$registry.register('pageSidePanel', new GeneralPageSidePanelType(context))
  app.$registry.register('pageSidePanel', new StylePageSidePanelType(context))
  app.$registry.register('pageSidePanel', new EventsPageSidePanelType(context))

  app.$registry.register('domain', new CustomDomainType(context))
  app.$registry.register('domain', new SubDomainType(context))

  app.$registry.register('pageSettings', new PagePageSettingsType(context))

  app.$registry.register('pathParamType', new TextPathParamType(context))
  app.$registry.register('pathParamType', new NumericPathParamType(context))

  app.$registry.register('pageAction', new PublishPageActionType(context))
  app.$registry.register('pageAction', new PreviewPageActionType(context))

  app.$registry.register(
    'builderDataProvider',
    new CurrentRecordDataProviderType(context)
  )
  app.$registry.register(
    'builderDataProvider',
    new DataSourceDataProviderType(context)
  )
  app.$registry.register(
    'builderDataProvider',
    new PageParameterDataProviderType(context)
  )
  app.$registry.register(
    'builderDataProvider',
    new FormDataProviderType(context)
  )
  app.$registry.register('themeConfigBlock', new MainThemeConfigBlock(context))

  app.$registry.register(
    'workflowAction',
    new NotificationWorkflowActionType(context)
  )
  app.$registry.register(
    'workflowAction',
    new OpenPageWorkflowActionType(context)
  )
  app.$registry.register(
    'workflowAction',
    new CreateRowWorkflowActionType(context)
  )
  app.$registry.register(
    'workflowAction',
    new UpdateRowWorkflowActionType(context)
  )

  app.$registry.register(
    'collectionField',
    new TextCollectionFieldType(context)
  )
  app.$registry.register(
    'collectionField',
    new LinkCollectionFieldType(context)
  )
}
