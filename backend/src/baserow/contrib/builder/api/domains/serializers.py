from typing import List

from django.utils.functional import lazy

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from baserow.api.services.serializers import PublicServiceSerializer
from baserow.contrib.builder.api.pages.serializers import PathParamSerializer
from baserow.contrib.builder.api.theme.serializers import (
    CombinedThemeConfigBlocksSerializer,
    serialize_builder_theme,
)
from baserow.contrib.builder.data_sources.models import DataSource
from baserow.contrib.builder.domains.models import Domain
from baserow.contrib.builder.domains.registries import domain_type_registry
from baserow.contrib.builder.elements.models import Element
from baserow.contrib.builder.elements.registries import element_type_registry
from baserow.contrib.builder.models import Builder
from baserow.contrib.builder.pages.models import Page
from baserow.core.services.registries import service_type_registry


class DomainSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField(help_text="The type of the domain.")

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance):
        return domain_type_registry.get_by_model(instance.specific_class).type

    class Meta:
        model = Domain
        fields = ("id", "type", "domain_name", "order", "builder_id", "last_published")
        extra_kwargs = {
            "id": {"read_only": True},
            "builder_id": {"read_only": True},
            "order": {"help_text": "Lowest first."},
        }


class CreateDomainSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(
        choices=lazy(domain_type_registry.get_types, list)(),
        required=True,
        help_text="The type of the domain.",
    )

    class Meta:
        model = Domain
        fields = (
            "type",
            "domain_name",
        )


class UpdateDomainSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(
        choices=lazy(domain_type_registry.get_types, list)(),
        required=False,
        help_text="The type of the domain.",
    )

    domain_name = serializers.CharField(
        required=False, help_text=Domain._meta.get_field("domain_name").help_text
    )

    class Meta:
        model = Domain
        fields = (
            "type",
            "domain_name",
        )


class OrderDomainsSerializer(serializers.Serializer):
    domain_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="The ids of the domains in the order they are supposed to be set in",
    )


class PublicElementSerializer(serializers.ModelSerializer):
    """
    Basic element serializer mostly for returned values.
    """

    type = serializers.SerializerMethodField(help_text="The type of the element.")

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance):
        return element_type_registry.get_by_model(instance.specific_class).type

    class Meta:
        model = Element
        fields = (
            "id",
            "type",
            "order",
            "parent_element_id",
            "place_in_container",
            "style_border_top_color",
            "style_border_top_size",
            "style_padding_top",
            "style_border_bottom_color",
            "style_border_bottom_size",
            "style_padding_bottom",
            "style_border_left_color",
            "style_border_left_size",
            "style_padding_left",
            "style_border_right_color",
            "style_border_right_size",
            "style_padding_right",
            "style_background",
            "style_background_color",
            "style_width",
        )
        extra_kwargs = {
            "id": {"read_only": True},
            "type": {"read_only": True},
        }


class PublicPageSerializer(serializers.ModelSerializer):
    """
    A public version of the page serializer with less data to prevent data leaks.
    """

    path_params = PathParamSerializer(many=True, required=False)

    class Meta:
        model = Page
        fields = ("id", "name", "path", "path_params")
        extra_kwargs = {
            "id": {"read_only": True},
            "builder_id": {"read_only": True},
            "order": {"help_text": "Lowest first."},
        }


class PublicBuilderSerializer(serializers.ModelSerializer):
    """
    A public version of the builder serializer with less data to prevent data leaks.
    """

    pages = serializers.SerializerMethodField(
        help_text="This field is specific to the `builder` application and contains "
        "an array of pages that are in the builder."
    )

    theme = serializers.SerializerMethodField(
        help_text="This field is specific to the `builder` application and contains "
        "the theme settings."
    )

    type = serializers.SerializerMethodField(help_text="The type of the object.")

    class Meta:
        model = Builder
        fields = ("id", "name", "pages", "type", "theme")

    @extend_schema_field(PublicPageSerializer(many=True))
    def get_pages(self, instance: Builder) -> List:
        """
        Returns the pages related to this public builder.

        :param instance: The builder application instance.
        :return: A list of serialized pages that belong to this instance.
        """

        pages = instance.page_set.all()

        return PublicPageSerializer(pages, many=True).data

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance: Builder) -> str:
        return "builder"

    @extend_schema_field(CombinedThemeConfigBlocksSerializer())
    def get_theme(self, instance):
        return serialize_builder_theme(instance)


class PublicDataSourceSerializer(PublicServiceSerializer):
    """
    Basic data_source serializer mostly for returned values. This serializer flatten the
    service properties so that from an API POV the data_source object only exists.
    """

    id = serializers.SerializerMethodField(help_text="Data source id.")
    name = serializers.SerializerMethodField(
        help_text=DataSource._meta.get_field("name").help_text
    )
    page_id = serializers.SerializerMethodField(
        help_text=DataSource._meta.get_field("page").help_text
    )
    order = serializers.SerializerMethodField(
        help_text=DataSource._meta.get_field("order").help_text
    )
    type = serializers.SerializerMethodField(help_text="The type of the data source.")

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance):
        if isinstance(instance, DataSource):
            return None
        else:
            return service_type_registry.get_by_model(instance.specific_class).type

    @extend_schema_field(OpenApiTypes.INT)
    def get_id(self, instance):
        return self.context["data_source"].id

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance):
        return self.context["data_source"].name

    @extend_schema_field(OpenApiTypes.INT)
    def get_page_id(self, instance):
        return self.context["data_source"].page_id

    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_order(self, instance):
        return self.context["data_source"].order

    class Meta(PublicServiceSerializer.Meta):
        fields = PublicServiceSerializer.Meta.fields + ("name", "page_id", "order")
        extra_kwargs = {
            **PublicServiceSerializer.Meta.extra_kwargs,
            "name": {"read_only": True},
            "page_id": {"read_only": True},
            "order": {"read_only": True, "help_text": "Lowest first."},
        }
