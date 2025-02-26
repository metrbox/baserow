from typing import Any, Dict, List, Optional
from zipfile import ZipFile

from django.contrib.auth.models import AbstractUser
from django.core.files.storage import Storage
from django.db import transaction
from django.db.transaction import Atomic
from django.urls import include, path
from django.utils import translation
from django.utils.translation import gettext as _

from baserow.contrib.builder.constants import IMPORT_SERIALIZED_IMPORTING
from baserow.contrib.builder.models import Builder
from baserow.contrib.builder.pages.handler import PageHandler
from baserow.contrib.builder.pages.models import Page
from baserow.contrib.builder.pages.service import PageService
from baserow.contrib.builder.theme.handler import ThemeHandler
from baserow.contrib.builder.theme.registries import theme_config_block_registry
from baserow.contrib.builder.types import BuilderDict
from baserow.core.integrations.handler import IntegrationHandler
from baserow.core.integrations.models import Integration
from baserow.core.models import Application, Workspace
from baserow.core.registries import ApplicationType, ImportExportConfig
from baserow.core.user_sources.handler import UserSourceHandler
from baserow.core.utils import ChildProgressBuilder


class BuilderApplicationType(ApplicationType):
    type = "builder"
    model_class = Builder
    supports_actions = False
    supports_integrations = True
    supports_user_sources = True

    # This lazy loads the serializer, which is needed because the `BuilderSerializer`
    # needs to decorate the `get_theme` with the `extend_schema_field` using a
    # generated serializer that needs the registry to be populated.
    @property
    def instance_serializer_class(self):
        from baserow.contrib.builder.api.serializers import BuilderSerializer

        return BuilderSerializer

    def get_api_urls(self):
        from .api import urls as api_urls

        return [
            path("builder/", include(api_urls, namespace=self.type)),
        ]

    def export_safe_transaction_context(self, application: Application) -> Atomic:
        return transaction.atomic()

    def init_application(self, user: AbstractUser, application: Application) -> None:
        with translation.override(user.profile.language):
            first_page_name = _("Homepage")

        PageService().create_page(user, application.specific, first_page_name, path="/")

    def export_serialized(
        self,
        builder: Builder,
        import_export_config: ImportExportConfig,
        files_zip: Optional[ZipFile] = None,
        storage: Optional[Storage] = None,
    ) -> BuilderDict:
        """
        Exports the builder application type to a serialized format that can later
        be imported via the `import_serialized`.
        """

        serialized_integrations = [
            IntegrationHandler().export_integration(i)
            for i in IntegrationHandler().get_integrations(builder)
        ]

        serialized_user_sources = [
            UserSourceHandler().export_user_source(us)
            for us in UserSourceHandler().get_user_sources(builder)
        ]

        pages = builder.page_set.all().prefetch_related("element_set", "datasource_set")

        serialized_pages = [PageHandler().export_page(p) for p in pages]

        serialized_theme = ThemeHandler().export_theme(builder)

        serialized_builder = super().export_serialized(
            builder, import_export_config, files_zip, storage
        )

        return BuilderDict(
            pages=serialized_pages,
            integrations=serialized_integrations,
            theme=serialized_theme,
            user_sources=serialized_user_sources,
            **serialized_builder
        )

    def import_integrations_serialized(
        self,
        builder: Builder,
        serialized_integrations: List[Dict[str, Any]],
        id_mapping: Dict[str, Any],
        files_zip: Optional[ZipFile] = None,
        storage: Optional[Storage] = None,
        progress_builder: Optional[ChildProgressBuilder] = None,
    ) -> List[Page]:
        """
        Import integrations to builder. This method has to be compatible with the output
        of `export_integrations_serialized`.

        :param builder: The builder the pages where exported from.
        :param serialized_integrations: The integrations that are supposed to be
            imported.
        :param progress_builder: A progress builder that allows for publishing progress.
        :param files_zip: An optional zip file for the related files.
        :param storage: The storage instance.
        :return: The created integration instances.
        """

        progress = ChildProgressBuilder.build(
            progress_builder, child_total=len(serialized_integrations)
        )

        imported_integrations: List[Integration] = []

        for serialized_integration in serialized_integrations:
            integration = IntegrationHandler().import_integration(
                builder,
                serialized_integration,
                id_mapping,
                cache=self.cache,
                files_zip=files_zip,
                storage=storage,
            )
            imported_integrations.append(integration)

            progress.increment(state=IMPORT_SERIALIZED_IMPORTING)

        return imported_integrations

    def import_user_sources_serialized(
        self,
        builder: Builder,
        serialized_user_sources: List[Dict[str, Any]],
        id_mapping: Dict[str, Any],
        files_zip: Optional[ZipFile] = None,
        storage: Optional[Storage] = None,
        progress_builder: Optional[ChildProgressBuilder] = None,
    ) -> List[Page]:
        """
        Import user sources to builder.

        :param builder: The builder the pages where exported from.
        :param serialized_user_sources: The user sources that are supposed to be
            imported.
        :param progress_builder: A progress builder that allows for publishing progress.
        :param files_zip: An optional zip file for the related files.
        :param storage: The storage instance.
        :return: The created user sources instances.
        """

        progress = ChildProgressBuilder.build(
            progress_builder, child_total=len(serialized_user_sources)
        )

        imported_user_sources: List[Integration] = []

        for serialized_user_source in serialized_user_sources:
            integration = UserSourceHandler().import_user_source(
                builder,
                serialized_user_source,
                id_mapping,
                cache=self.cache,
                files_zip=files_zip,
                storage=storage,
            )
            imported_user_sources.append(integration)

            progress.increment(state=IMPORT_SERIALIZED_IMPORTING)

        return imported_user_sources

    def import_serialized(
        self,
        workspace: Workspace,
        serialized_values: Dict[str, Any],
        import_export_config: ImportExportConfig,
        id_mapping: Dict[str, Any],
        files_zip: Optional[ZipFile] = None,
        storage: Optional[Storage] = None,
        progress_builder: Optional[ChildProgressBuilder] = None,
    ) -> Application:
        """
        Imports a builder application exported by the `export_serialized` method.
        """

        self.cache = {}

        serialized_pages = serialized_values.pop("pages")
        serialized_integrations = serialized_values.pop("integrations")
        serialized_user_sources = serialized_values.pop("user_sources")
        serialized_theme = serialized_values.pop("theme")

        builder_progress, integration_progress, user_source_progress, page_progress = (
            5,
            10,
            15,
            80,
        )
        progress = ChildProgressBuilder.build(
            progress_builder, child_total=builder_progress + page_progress
        )

        if "import_workspace_id" not in id_mapping and workspace is not None:
            id_mapping["import_workspace_id"] = workspace.id

        if "workspace_id" not in id_mapping and workspace is not None:
            id_mapping["workspace_id"] = workspace.id

        application = super().import_serialized(
            workspace,
            serialized_values,
            import_export_config,
            id_mapping,
            files_zip,
            storage,
            progress.create_child_builder(represents_progress=builder_progress),
        )

        builder = application.specific

        if not serialized_integrations:
            progress.increment(
                state=IMPORT_SERIALIZED_IMPORTING, by=integration_progress
            )
        else:
            self.import_integrations_serialized(
                builder,
                serialized_integrations,
                id_mapping,
                files_zip,
                storage,
                progress.create_child_builder(represents_progress=integration_progress),
            )

        if not serialized_user_sources:
            progress.increment(
                state=IMPORT_SERIALIZED_IMPORTING, by=user_source_progress
            )
        else:
            self.import_user_sources_serialized(
                builder,
                serialized_user_sources,
                id_mapping,
                files_zip,
                storage,
                progress.create_child_builder(represents_progress=user_source_progress),
            )

        if not serialized_pages:
            progress.increment(state=IMPORT_SERIALIZED_IMPORTING, by=page_progress)
        else:
            PageHandler().import_pages(
                builder,
                serialized_pages,
                id_mapping,
                files_zip,
                storage,
                progress.create_child_builder(represents_progress=page_progress),
            )

        ThemeHandler().import_theme(builder, serialized_theme, id_mapping)

        return builder

    def enhance_queryset(self, queryset):
        queryset = queryset.prefetch_related("page_set")
        queryset = theme_config_block_registry.enhance_list_builder_queryset(queryset)
        return queryset
