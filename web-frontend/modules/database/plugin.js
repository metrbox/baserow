import { DatabaseApplicationType } from '@baserow/modules/database/applicationTypes'
import { DuplicateTableJobType } from '@baserow/modules/database/jobTypes'
import {
  GridViewType,
  GalleryViewType,
  FormViewType,
} from '@baserow/modules/database/viewTypes'
import {
  TextFieldType,
  LongTextFieldType,
  URLFieldType,
  EmailFieldType,
  LinkRowFieldType,
  NumberFieldType,
  RatingFieldType,
  BooleanFieldType,
  DateFieldType,
  LastModifiedFieldType,
  LastModifiedByFieldType,
  FileFieldType,
  SingleSelectFieldType,
  MultipleSelectFieldType,
  PhoneNumberFieldType,
  CreatedOnFieldType,
  CreatedByFieldType,
  DurationFieldType,
  FormulaFieldType,
  CountFieldType,
  RollupFieldType,
  LookupFieldType,
  MultipleCollaboratorsFieldType,
  UUIDFieldType,
  AutonumberFieldType,
} from '@baserow/modules/database/fieldTypes'
import {
  EqualViewFilterType,
  NotEqualViewFilterType,
  DateEqualViewFilterType,
  DateNotEqualViewFilterType,
  ContainsViewFilterType,
  FilenameContainsViewFilterType,
  FilesLowerThanViewFilterType,
  HasFileTypeViewFilterType,
  ContainsNotViewFilterType,
  LengthIsLowerThanViewFilterType,
  HigherThanViewFilterType,
  LowerThanViewFilterType,
  IsEvenAndWholeViewFilterType,
  SingleSelectEqualViewFilterType,
  SingleSelectNotEqualViewFilterType,
  BooleanViewFilterType,
  EmptyViewFilterType,
  NotEmptyViewFilterType,
  DateEqualsTodayViewFilterType,
  DateBeforeTodayViewFilterType,
  DateAfterTodayViewFilterType,
  DateWithinDaysViewFilterType,
  DateWithinWeeksViewFilterType,
  DateWithinMonthsViewFilterType,
  DateEqualsDaysAgoViewFilterType,
  DateEqualsMonthsAgoViewFilterType,
  DateEqualsYearsAgoViewFilterType,
  DateEqualsCurrentWeekViewFilterType,
  DateEqualsCurrentMonthViewFilterType,
  DateEqualsCurrentYearViewFilterType,
  DateBeforeViewFilterType,
  DateBeforeOrEqualViewFilterType,
  DateAfterDaysAgoViewFilterType,
  DateAfterViewFilterType,
  DateAfterOrEqualViewFilterType,
  DateEqualsDayOfMonthViewFilterType,
  LinkRowHasFilterType,
  LinkRowHasNotFilterType,
  MultipleSelectHasFilterType,
  MultipleSelectHasNotFilterType,
  MultipleCollaboratorsHasFilterType,
  MultipleCollaboratorsHasNotFilterType,
  LinkRowContainsFilterType,
  LinkRowNotContainsFilterType,
  ContainsWordViewFilterType,
  DoesntContainWordViewFilterType,
  UserIsFilterType,
  UserIsNotFilterType,
} from '@baserow/modules/database/viewFilters'
import {
  CSVImporterType,
  PasteImporterType,
  XMLImporterType,
  JSONImporterType,
} from '@baserow/modules/database/importerTypes'
import {
  RowsCreatedWebhookEventType,
  RowsUpdatedWebhookEventType,
  RowsDeletedWebhookEventType,
} from '@baserow/modules/database/webhookEventTypes'
import {
  ImageFilePreview,
  AudioFilePreview,
  VideoFilePreview,
  PDFBrowserFilePreview,
  GoogleDocFilePreview,
} from '@baserow/modules/database/filePreviewTypes'
import { APITokenSettingsType } from '@baserow/modules/database/settingsTypes'

import tableStore from '@baserow/modules/database/store/table'
import viewStore from '@baserow/modules/database/store/view'
import fieldStore from '@baserow/modules/database/store/field'
import gridStore from '@baserow/modules/database/store/view/grid'
import galleryStore from '@baserow/modules/database/store/view/gallery'
import formStore from '@baserow/modules/database/store/view/form'
import rowModal from '@baserow/modules/database/store/rowModal'
import publicStore from '@baserow/modules/database/store/view/public'
import rowModalNavigationStore from '@baserow/modules/database/store/rowModalNavigation'
import rowHistoryStore from '@baserow/modules/database/store/rowHistory'

import { registerRealtimeEvents } from '@baserow/modules/database/realtime'
import { CSVTableExporterType } from '@baserow/modules/database/exporterTypes'
import {
  BaserowAdd,
  BaserowAnd,
  BaserowConcat,
  BaserowDateDiff,
  BaserowDateInterval,
  BaserowDatetimeFormat,
  BaserowDatetimeFormatTz,
  BaserowDay,
  BaserowDivide,
  BaserowEncodeUri,
  BaserowEncodeUriComponent,
  BaserowEqual,
  BaserowHasOption,
  BaserowField,
  BaserowSearch,
  BaserowGreaterThan,
  BaserowGreaterThanOrEqual,
  BaserowIf,
  BaserowIsBlank,
  BaserowIsNull,
  BaserowLessThan,
  BaserowLessThanOrEqual,
  BaserowLower,
  BaserowSplitPart,
  BaserowMinus,
  BaserowMultiply,
  BaserowNot,
  BaserowOr,
  BaserowReplace,
  BaserowRowId,
  BaserowT,
  BaserowNow,
  BaserowToday,
  BaserowToDateTz,
  BaserowToDate,
  BaserowToNumber,
  BaserowToText,
  BaserowUpper,
  BaserowReverse,
  BaserowLength,
  BaserowNotEqual,
  BaserowLookup,
  BaserowSum,
  BaserowAvg,
  BaserowVariancePop,
  BaserowVarianceSample,
  BaserowStddevSample,
  BaserowStddevPop,
  BaserowJoin,
  BaserowCount,
  BaserowMin,
  BaserowMax,
  BaserowEvery,
  BaserowAny,
  BaserowWhenEmpty,
  BaserowSecond,
  BaserowYear,
  BaserowMonth,
  BaserowLeast,
  BaserowGreatest,
  BaserowRegexReplace,
  BaserowLink,
  BaserowTrim,
  BaserowRight,
  BaserowLeft,
  BaserowContains,
  BaserowFilter,
  BaserowTrunc,
  BaserowIsNaN,
  BaserowWhenNaN,
  BaserowEven,
  BaserowOdd,
  BaserowCeil,
  BaserowFloor,
  BaserowAbs,
  BaserowExp,
  BaserowLn,
  BaserowSign,
  BaserowSqrt,
  BaserowRound,
  BaserowLog,
  BaserowPower,
  BaserowMod,
  BaserowButton,
  BaserowGetLinkUrl,
  BaserowGetLinkLabel,
  BaserowIsImage,
  BaserowGetImageHeight,
  BaserowGetImageWidth,
  BaserowGetFileSize,
  BaserowGetFileMimeType,
  BaserowGetFileVisibleName,
  BaserowIndex,
  BaserowGetFileCount,
} from '@baserow/modules/database/formula/functions'
import {
  BaserowFormulaArrayType,
  BaserowFormulaBooleanType,
  BaserowFormulaButtonType,
  BaserowFormulaCharType,
  BaserowFormulaLinkType,
  BaserowFormulaDateIntervalType,
  BaserowFormulaDateType,
  BaserowFormulaInvalidType,
  BaserowFormulaNumberType,
  BaserowFormulaSingleSelectType,
  BaserowFormulaMultipleSelectType,
  BaserowFormulaSpecialType,
  BaserowFormulaTextType,
  BaserowFormulaFileType,
} from '@baserow/modules/database/formula/formulaTypes'
import {
  EmptyCountViewAggregationType,
  NotEmptyCountViewAggregationType,
  CheckedCountViewAggregationType,
  NotCheckedCountViewAggregationType,
  EmptyPercentageViewAggregationType,
  NotEmptyPercentageViewAggregationType,
  CheckedPercentageViewAggregationType,
  NotCheckedPercentageViewAggregationType,
  UniqueCountViewAggregationType,
  MinViewAggregationType,
  MaxViewAggregationType,
  EarliestDateViewAggregationType,
  LatestDateViewAggregationType,
  SumViewAggregationType,
  AverageViewAggregationType,
  StdDevViewAggregationType,
  VarianceViewAggregationType,
  MedianViewAggregationType,
} from '@baserow/modules/database/viewAggregationTypes'
import { FormViewFormModeType } from '@baserow/modules/database/formViewModeTypes'
import { CollaborativeViewOwnershipType } from '@baserow/modules/database/viewOwnershipTypes'
import { DatabasePlugin } from '@baserow/modules/database/plugins'
import {
  CollaboratorAddedToRowNotificationType,
  FormSubmittedNotificationType,
} from '@baserow/modules/database/notificationTypes'
import { HistoryRowModalSidebarType } from '@baserow/modules/database/rowModalSidebarTypes'

import en from '@baserow/modules/database/locales/en.json'
import fr from '@baserow/modules/database/locales/fr.json'
import nl from '@baserow/modules/database/locales/nl.json'
import de from '@baserow/modules/database/locales/de.json'
import es from '@baserow/modules/database/locales/es.json'
import it from '@baserow/modules/database/locales/it.json'
import pl from '@baserow/modules/database/locales/pl.json'

export default (context) => {
  const { store, app, isDev } = context

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

  store.registerModule('table', tableStore)
  store.registerModule('view', viewStore)
  store.registerModule('field', fieldStore)
  store.registerModule('rowModal', rowModal)
  store.registerModule('rowModalNavigation', rowModalNavigationStore)
  store.registerModule('rowHistory', rowHistoryStore)
  store.registerModule('page/view/grid', gridStore)
  store.registerModule('page/view/gallery', galleryStore)
  store.registerModule('page/view/form', formStore)
  store.registerModule('page/view/public', publicStore)
  store.registerModule('template/view/grid', gridStore)
  store.registerModule('template/view/gallery', galleryStore)
  store.registerModule('template/view/form', formStore)

  app.$registry.registerNamespace('viewDecorator')
  app.$registry.registerNamespace('decoratorValueProvider')

  app.$registry.register('plugin', new DatabasePlugin(context))
  app.$registry.register('application', new DatabaseApplicationType(context))
  app.$registry.register('job', new DuplicateTableJobType(context))
  app.$registry.register('view', new GridViewType(context))
  app.$registry.register('view', new GalleryViewType(context))
  app.$registry.register('view', new FormViewType(context))
  app.$registry.register('viewFilter', new EqualViewFilterType(context))
  app.$registry.register('viewFilter', new NotEqualViewFilterType(context))
  app.$registry.register('viewFilter', new DateEqualViewFilterType(context))
  app.$registry.register('viewFilter', new DateNotEqualViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new DateEqualsTodayViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateBeforeTodayViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateAfterTodayViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateWithinDaysViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateWithinWeeksViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateWithinMonthsViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsDaysAgoViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsMonthsAgoViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsYearsAgoViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsCurrentWeekViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsCurrentMonthViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsCurrentYearViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateEqualsDayOfMonthViewFilterType(context)
  )
  app.$registry.register('viewFilter', new DateBeforeViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new DateBeforeOrEqualViewFilterType(context)
  )
  app.$registry.register('viewFilter', new DateAfterViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new DateAfterOrEqualViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new DateAfterDaysAgoViewFilterType(context)
  )
  app.$registry.register('viewFilter', new ContainsViewFilterType(context))
  app.$registry.register('viewFilter', new ContainsNotViewFilterType(context))
  app.$registry.register('viewFilter', new ContainsWordViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new DoesntContainWordViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new FilenameContainsViewFilterType(context)
  )
  app.$registry.register('viewFilter', new HasFileTypeViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new FilesLowerThanViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new LengthIsLowerThanViewFilterType(context)
  )
  app.$registry.register('viewFilter', new HigherThanViewFilterType(context))
  app.$registry.register('viewFilter', new LowerThanViewFilterType(context))
  app.$registry.register(
    'viewFilter',
    new IsEvenAndWholeViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new SingleSelectEqualViewFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new SingleSelectNotEqualViewFilterType(context)
  )
  app.$registry.register('viewFilter', new BooleanViewFilterType(context))
  app.$registry.register('viewFilter', new LinkRowHasFilterType(context))
  app.$registry.register('viewFilter', new LinkRowHasNotFilterType(context))
  app.$registry.register('viewFilter', new LinkRowContainsFilterType(context))
  app.$registry.register(
    'viewFilter',
    new LinkRowNotContainsFilterType(context)
  )
  app.$registry.register('viewFilter', new MultipleSelectHasFilterType(context))
  app.$registry.register(
    'viewFilter',
    new MultipleSelectHasNotFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new MultipleCollaboratorsHasFilterType(context)
  )
  app.$registry.register(
    'viewFilter',
    new MultipleCollaboratorsHasNotFilterType(context)
  )
  app.$registry.register('viewFilter', new EmptyViewFilterType(context))
  app.$registry.register('viewFilter', new NotEmptyViewFilterType(context))
  app.$registry.register('viewFilter', new UserIsFilterType(context))
  app.$registry.register('viewFilter', new UserIsNotFilterType(context))

  app.$registry.register(
    'viewOwnershipType',
    new CollaborativeViewOwnershipType(context)
  )

  app.$registry.register('field', new TextFieldType(context))
  app.$registry.register('field', new LongTextFieldType(context))
  app.$registry.register('field', new LinkRowFieldType(context))
  app.$registry.register('field', new NumberFieldType(context))
  app.$registry.register('field', new RatingFieldType(context))
  app.$registry.register('field', new BooleanFieldType(context))
  app.$registry.register('field', new DateFieldType(context))
  app.$registry.register('field', new LastModifiedFieldType(context))
  app.$registry.register('field', new LastModifiedByFieldType(context))
  app.$registry.register('field', new CreatedOnFieldType(context))
  app.$registry.register('field', new CreatedByFieldType(context))
  app.$registry.register('field', new DurationFieldType(context))
  app.$registry.register('field', new URLFieldType(context))
  app.$registry.register('field', new EmailFieldType(context))
  app.$registry.register('field', new FileFieldType(context))
  app.$registry.register('field', new SingleSelectFieldType(context))
  app.$registry.register('field', new MultipleSelectFieldType(context))
  app.$registry.register('field', new PhoneNumberFieldType(context))
  app.$registry.register('field', new FormulaFieldType(context))
  app.$registry.register('field', new CountFieldType(context))
  app.$registry.register('field', new RollupFieldType(context))
  app.$registry.register('field', new LookupFieldType(context))
  app.$registry.register('field', new MultipleCollaboratorsFieldType(context))
  app.$registry.register('field', new UUIDFieldType(context))
  app.$registry.register('field', new AutonumberFieldType(context))

  app.$registry.register('importer', new CSVImporterType(context))
  app.$registry.register('importer', new PasteImporterType(context))
  app.$registry.register('importer', new XMLImporterType(context))
  app.$registry.register('importer', new JSONImporterType(context))
  app.$registry.register('settings', new APITokenSettingsType(context))
  app.$registry.register('exporter', new CSVTableExporterType(context))
  app.$registry.register(
    'webhookEvent',
    new RowsCreatedWebhookEventType(context)
  )
  app.$registry.register(
    'webhookEvent',
    new RowsUpdatedWebhookEventType(context)
  )
  app.$registry.register(
    'webhookEvent',
    new RowsDeletedWebhookEventType(context)
  )

  // Text functions
  app.$registry.register('formula_function', new BaserowUpper(context))
  app.$registry.register('formula_function', new BaserowLower(context))
  app.$registry.register('formula_function', new BaserowConcat(context))
  app.$registry.register('formula_function', new BaserowToText(context))
  app.$registry.register('formula_function', new BaserowT(context))
  app.$registry.register('formula_function', new BaserowReplace(context))
  app.$registry.register('formula_function', new BaserowSearch(context))
  app.$registry.register('formula_function', new BaserowLength(context))
  app.$registry.register('formula_function', new BaserowReverse(context))
  app.$registry.register('formula_function', new BaserowEncodeUri(context))
  app.$registry.register(
    'formula_function',
    new BaserowEncodeUriComponent(context)
  )
  app.$registry.register('formula_function', new BaserowSplitPart(context))
  // Number functions
  app.$registry.register('formula_function', new BaserowMultiply(context))
  app.$registry.register('formula_function', new BaserowDivide(context))
  app.$registry.register('formula_function', new BaserowToNumber(context))
  // Boolean functions
  app.$registry.register('formula_function', new BaserowIf(context))
  app.$registry.register('formula_function', new BaserowEqual(context))
  app.$registry.register('formula_function', new BaserowHasOption(context))
  app.$registry.register('formula_function', new BaserowIsBlank(context))
  app.$registry.register('formula_function', new BaserowIsNull(context))
  app.$registry.register('formula_function', new BaserowNot(context))
  app.$registry.register('formula_function', new BaserowNotEqual(context))
  app.$registry.register('formula_function', new BaserowGreaterThan(context))
  app.$registry.register(
    'formula_function',
    new BaserowGreaterThanOrEqual(context)
  )
  app.$registry.register('formula_function', new BaserowLessThan(context))
  app.$registry.register(
    'formula_function',
    new BaserowLessThanOrEqual(context)
  )
  app.$registry.register('formula_function', new BaserowAnd(context))
  app.$registry.register('formula_function', new BaserowOr(context))
  // Date functions
  app.$registry.register('formula_function', new BaserowDatetimeFormat(context))
  app.$registry.register(
    'formula_function',
    new BaserowDatetimeFormatTz(context)
  )
  app.$registry.register('formula_function', new BaserowDay(context))
  app.$registry.register('formula_function', new BaserowNow(context))
  app.$registry.register('formula_function', new BaserowToday(context))
  app.$registry.register('formula_function', new BaserowToDateTz(context))
  app.$registry.register('formula_function', new BaserowToDate(context))
  app.$registry.register('formula_function', new BaserowDateDiff(context))
  // Date interval functions
  app.$registry.register('formula_function', new BaserowDateInterval(context))
  // Special functions
  app.$registry.register('formula_function', new BaserowAdd(context))
  app.$registry.register('formula_function', new BaserowMinus(context))
  app.$registry.register('formula_function', new BaserowField(context))
  app.$registry.register('formula_function', new BaserowLookup(context))
  app.$registry.register('formula_function', new BaserowRowId(context))
  app.$registry.register('formula_function', new BaserowContains(context))
  app.$registry.register('formula_function', new BaserowLeft(context))
  app.$registry.register('formula_function', new BaserowRight(context))
  app.$registry.register('formula_function', new BaserowTrim(context))
  app.$registry.register('formula_function', new BaserowRegexReplace(context))
  app.$registry.register('formula_function', new BaserowGreatest(context))
  app.$registry.register('formula_function', new BaserowLeast(context))
  app.$registry.register('formula_function', new BaserowMonth(context))
  app.$registry.register('formula_function', new BaserowYear(context))
  app.$registry.register('formula_function', new BaserowSecond(context))
  app.$registry.register('formula_function', new BaserowWhenEmpty(context))
  app.$registry.register('formula_function', new BaserowAny(context))
  app.$registry.register('formula_function', new BaserowEvery(context))
  app.$registry.register('formula_function', new BaserowMax(context))
  app.$registry.register('formula_function', new BaserowMin(context))
  app.$registry.register('formula_function', new BaserowCount(context))
  app.$registry.register('formula_function', new BaserowJoin(context))
  app.$registry.register('formula_function', new BaserowStddevPop(context))
  app.$registry.register('formula_function', new BaserowStddevSample(context))
  app.$registry.register('formula_function', new BaserowVarianceSample(context))
  app.$registry.register('formula_function', new BaserowVariancePop(context))
  app.$registry.register('formula_function', new BaserowAvg(context))
  app.$registry.register('formula_function', new BaserowSum(context))
  app.$registry.register('formula_function', new BaserowFilter(context))
  app.$registry.register('formula_function', new BaserowTrunc(context))
  app.$registry.register('formula_function', new BaserowIsNaN(context))
  app.$registry.register('formula_function', new BaserowWhenNaN(context))
  app.$registry.register('formula_function', new BaserowEven(context))
  app.$registry.register('formula_function', new BaserowOdd(context))
  app.$registry.register('formula_function', new BaserowAbs(context))
  app.$registry.register('formula_function', new BaserowCeil(context))
  app.$registry.register('formula_function', new BaserowFloor(context))
  app.$registry.register('formula_function', new BaserowSign(context))
  app.$registry.register('formula_function', new BaserowLog(context))
  app.$registry.register('formula_function', new BaserowExp(context))
  app.$registry.register('formula_function', new BaserowLn(context))
  app.$registry.register('formula_function', new BaserowPower(context))
  app.$registry.register('formula_function', new BaserowSqrt(context))
  app.$registry.register('formula_function', new BaserowRound(context))
  app.$registry.register('formula_function', new BaserowMod(context))
  // Link functions
  app.$registry.register('formula_function', new BaserowLink(context))
  app.$registry.register('formula_function', new BaserowButton(context))
  app.$registry.register('formula_function', new BaserowGetLinkUrl(context))
  app.$registry.register('formula_function', new BaserowGetLinkLabel(context))
  // File functions
  app.$registry.register(
    'formula_function',
    new BaserowGetFileVisibleName(context)
  )
  app.$registry.register(
    'formula_function',
    new BaserowGetFileMimeType(context)
  )
  app.$registry.register('formula_function', new BaserowGetFileSize(context))
  app.$registry.register('formula_function', new BaserowGetImageWidth(context))
  app.$registry.register('formula_function', new BaserowGetImageHeight(context))
  app.$registry.register('formula_function', new BaserowIsImage(context))

  app.$registry.register('formula_function', new BaserowGetFileCount(context))
  app.$registry.register('formula_function', new BaserowIndex(context))

  // Formula Types
  app.$registry.register('formula_type', new BaserowFormulaTextType(context))
  app.$registry.register('formula_type', new BaserowFormulaCharType(context))
  app.$registry.register('formula_type', new BaserowFormulaBooleanType(context))
  app.$registry.register('formula_type', new BaserowFormulaDateType(context))
  app.$registry.register(
    'formula_type',
    new BaserowFormulaDateIntervalType(context)
  )
  app.$registry.register('formula_type', new BaserowFormulaNumberType(context))
  app.$registry.register('formula_type', new BaserowFormulaArrayType(context))
  app.$registry.register('formula_type', new BaserowFormulaSpecialType(context))
  app.$registry.register('formula_type', new BaserowFormulaInvalidType(context))
  app.$registry.register(
    'formula_type',
    new BaserowFormulaSingleSelectType(context)
  )
  app.$registry.register(
    'formula_type',
    new BaserowFormulaMultipleSelectType(context)
  )
  app.$registry.register('formula_type', new BaserowFormulaButtonType(context))
  app.$registry.register('formula_type', new BaserowFormulaLinkType(context))
  app.$registry.register('formula_type', new BaserowFormulaFileType(context))

  // File preview types
  app.$registry.register('preview', new ImageFilePreview(context))
  app.$registry.register('preview', new AudioFilePreview(context))
  app.$registry.register('preview', new VideoFilePreview(context))
  app.$registry.register('preview', new PDFBrowserFilePreview(context))
  app.$registry.register('preview', new GoogleDocFilePreview(context))

  app.$registry.register('viewAggregation', new MinViewAggregationType(context))
  app.$registry.register('viewAggregation', new MaxViewAggregationType(context))
  app.$registry.register('viewAggregation', new SumViewAggregationType(context))
  app.$registry.register(
    'viewAggregation',
    new AverageViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new MedianViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new StdDevViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new VarianceViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new EarliestDateViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new LatestDateViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new EmptyCountViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new NotEmptyCountViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new CheckedCountViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new NotCheckedCountViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new EmptyPercentageViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new NotEmptyPercentageViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new CheckedPercentageViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new NotCheckedPercentageViewAggregationType(context)
  )
  app.$registry.register(
    'viewAggregation',
    new UniqueCountViewAggregationType(context)
  )

  app.$registry.register('formViewMode', new FormViewFormModeType(context))

  // notifications
  app.$registry.register(
    'notification',
    new CollaboratorAddedToRowNotificationType(context)
  )
  app.$registry.register(
    'notification',
    new FormSubmittedNotificationType(context)
  )

  app.$registry.register(
    'rowModalSidebar',
    new HistoryRowModalSidebarType(context)
  )

  registerRealtimeEvents(app.$realtime)
}
