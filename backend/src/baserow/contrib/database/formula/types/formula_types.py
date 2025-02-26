import datetime
from abc import ABC
from decimal import Decimal
from typing import Any, List, Optional, Type, Union

from django.contrib.postgres.fields import ArrayField, JSONField
from django.core.files.storage import default_storage
from django.db import models
from django.db.models import Expression, F, Func, Q, QuerySet, TextField, Value
from django.db.models.functions import Cast, Concat
from django.utils import timezone

from dateutil import parser
from rest_framework import serializers
from rest_framework.fields import Field

from baserow.contrib.database.fields.expressions import (
    extract_jsonb_array_values_to_single_string,
    extract_jsonb_list_values_to_array,
    json_extract_path,
)
from baserow.contrib.database.fields.field_sortings import OptionallyAnnotatedOrderBy
from baserow.contrib.database.fields.mixins import get_date_time_format
from baserow.contrib.database.formula.ast.tree import (
    BaserowBooleanLiteral,
    BaserowDecimalLiteral,
    BaserowExpression,
    BaserowFieldReference,
    BaserowFunctionCall,
    BaserowIntegerLiteral,
    BaserowStringLiteral,
)
from baserow.contrib.database.formula.registries import formula_function_registry
from baserow.contrib.database.formula.types.exceptions import UnknownFormulaType
from baserow.contrib.database.formula.types.formula_type import (
    BaserowFormulaInvalidType,
    BaserowFormulaType,
    BaserowFormulaTypeHasEmptyBaserowExpression,
    BaserowFormulaValidType,
    UnTyped,
)
from baserow.core.utils import list_to_comma_separated_string


class BaserowJSONBObjectBaseType(BaserowFormulaValidType, ABC):
    pass


class BaserowFormulaBaseTextType(BaserowFormulaTypeHasEmptyBaserowExpression):
    can_group_by = True

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            BaserowFormulaTextType,
            BaserowFormulaDateType,
            BaserowFormulaNumberType,
            BaserowFormulaBooleanType,
            BaserowFormulaCharType,
            BaserowFormulaLinkType,
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        # Force users to explicitly convert to text before doing any limit comparison
        # operators as lexicographical comparison can be surprising and so should be opt
        # in
        return [BaserowFormulaTextType, BaserowFormulaCharType, BaserowFormulaLinkType]

    @property
    def addable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [BaserowFormulaTextType, BaserowFormulaCharType, BaserowFormulaLinkType]

    def add(
        self,
        add_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaTextType]",
        arg2: "BaserowExpression[BaserowFormulaTextType]",
    ):
        return formula_function_registry.get("concat").call_and_type_with_args(
            [arg1, arg2]
        )

    def placeholder_empty_value(self):
        return Value("", output_field=models.TextField())

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return literal("")


class BaserowFormulaTextType(
    BaserowFormulaBaseTextType,
    BaserowFormulaTypeHasEmptyBaserowExpression,
    BaserowFormulaValidType,
):
    type = "text"
    baserow_field_type = "text"
    can_order_by_in_array = True

    def __init__(self, *args, **kwargs):
        unwrap_cast_to_text = kwargs.pop("unwrap_cast_to_text", True)
        self.unwrap_cast_to_text = unwrap_cast_to_text
        super().__init__(*args, **kwargs)

    def cast_to_text(
        self,
        to_text_func_call: "BaserowFunctionCall[UnTyped]",
        arg: "BaserowExpression[BaserowFormulaValidType]",
    ) -> "BaserowExpression[BaserowFormulaType]":
        if self.unwrap_cast_to_text:
            # Explicitly unwrap the func_call here and just return the arg as it is
            # already in the text type and we don't want to return to_text(arg) but
            # instead just arg.
            return arg
        else:
            # In some cases, we're using the `text` formula type for types that are
            # not necessarily already in the text format. In that case, we do want to
            # cast it to the text type. This is for example the case with the UUID
            # field type.
            return super().cast_to_text(to_text_func_call, arg)

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleKeyArrayExpression(
            field_name, "value", "text", output_field=models.TextField()
        )


class BaserowFormulaCharType(BaserowFormulaTextType, BaserowFormulaValidType):
    type = "char"
    baserow_field_type = "text"
    can_order_by_in_array = True
    can_group_by = True

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleKeyArrayExpression(
            field_name, "value", "text", output_field=models.TextField()
        )

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return formula_function_registry.get("tovarchar")(literal(""))


class BaserowFormulaLinkType(BaserowJSONBObjectBaseType):
    type = "link"
    baserow_field_type = None
    can_order_by = False
    can_group_by = False

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            type(self),
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    @property
    def addable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    @property
    def subtractable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    def cast_to_text(
        self,
        to_text_func_call: "BaserowFunctionCall[UnTyped]",
        arg: "BaserowExpression[BaserowFormulaValidType]",
    ) -> "BaserowExpression[BaserowFormulaType]":
        return formula_function_registry.get("get_link_label")(arg)

    def get_baserow_field_instance_and_type(self):
        return self, self

    def get_model_field(self, instance, **kwargs) -> models.Field:
        kwargs["null"] = True
        kwargs["blank"] = True

        return JSONField(default=dict, **kwargs)

    def get_response_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        return self.get_serializer_field(instance, **kwargs)

    def get_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        required = kwargs.get("required", False)

        from baserow.contrib.database.formula.types.serializers import LinkSerializer

        return LinkSerializer(
            **{"required": required, "allow_null": not required, **kwargs}
        )

    def get_export_value(self, value, field_object, rich_value=False) -> Any:
        if rich_value:
            return value
        elif value is not None:
            if "label" in value:
                return f"{value['label']} ({value['url']})"
            else:
                return f"{value['url']}"
        else:
            return ""

    def contains_query(self, field_name, value, model_field, field):
        value = value.strip()
        # If an empty value has been provided we do not want to filter at all.
        if value == "":
            return Q()
        return Q(**{f"{field_name}__url__icontains": value}) | Q(
            **{f"{field_name}__label__icontains": value}
        )

    def get_alter_column_prepare_old_value(self, connection, from_field, to_field):
        sql = f"""
            p_in = p_in->'label' + ' (' + p_in->'url' + ')';
        """
        return sql, {}

    def get_human_readable_value(self, value: Any, field_object) -> str:
        human_readable_value = self.get_export_value(
            value, field_object, rich_value=False
        )
        if human_readable_value is None:
            return ""
        else:
            return str(human_readable_value)

    def placeholder_empty_value(self):
        return Value({}, output_field=JSONField())

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return formula_function_registry.get("link")(literal(""))

    def get_search_expression(self, field, queryset):
        return Concat(
            json_extract_path(F(field.db_column), [Value("label")]),
            Value(" ("),
            json_extract_path(F(field.db_column), [Value("url")]),
            Value(")"),
            output_field=models.TextField(),
        )

    def get_search_expression_in_array(self, field, queryset):
        def transform_value_to_text_func(x):
            # Make sure we don't send the keys of the jsonb to ts_vector by extracting
            # and re-ordering the label/url parameters to match the correct format
            return Func(
                x,
                Value('.*"url".*:.*"([^"]+)".*"label".*:.*"([^"]+)".*'),
                Value("\\2 (\\1)"),
                Value("g", output_field=models.TextField()),
                function="regexp_replace",
                output_field=models.TextField(),
            )

        return extract_jsonb_array_values_to_single_string(
            field,
            queryset,
            transform_value_to_text_func=transform_value_to_text_func,
        )

    def is_searchable(self, field):
        return True


class BaserowFormulaButtonType(BaserowFormulaLinkType):
    type = "button"


class BaserowFormulaNumberType(
    BaserowFormulaTypeHasEmptyBaserowExpression, BaserowFormulaValidType
):
    type = "number"
    baserow_field_type = "number"
    user_overridable_formatting_option_fields = ["number_decimal_places"]
    MAX_DIGITS = 50
    can_order_by_in_array = True
    can_group_by = True

    def __init__(self, number_decimal_places: int, **kwargs):
        super().__init__(**kwargs)
        self.number_decimal_places = number_decimal_places

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            type(self),
            BaserowFormulaTextType,
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def addable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def subtractable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    def add(
        self,
        add_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaNumberType]",
        arg2: "BaserowExpression[BaserowFormulaNumberType]",
    ):
        return add_func_call.with_valid_type(
            calculate_number_type([arg1.expression_type, arg2.expression_type])
        )

    def minus(
        self,
        minus_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaNumberType]",
        arg2: "BaserowExpression[BaserowFormulaNumberType]",
    ):
        return minus_func_call.with_valid_type(
            calculate_number_type([arg1.expression_type, arg2.expression_type])
        )

    def should_recreate_when_old_type_was(self, old_type: "BaserowFormulaType") -> bool:
        if isinstance(old_type, BaserowFormulaNumberType):
            return self.number_decimal_places != old_type.number_decimal_places
        else:
            return True

    def wrap_at_field_level(self, expr: "BaserowExpression[BaserowFormulaType]"):
        return formula_function_registry.get("error_to_nan")(expr)

    def unwrap_at_field_level(self, expr: "BaserowFunctionCall[BaserowFormulaType]"):
        return expr.args[0].with_valid_type(expr.expression_type)

    def placeholder_empty_value(self):
        return Value(
            0, output_field=models.DecimalField(max_digits=50, decimal_places=0)
        )

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return literal(0)

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleKeyArrayExpression(
            field_name,
            "value",
            "numeric",
            output_field=ArrayField(
                base_field=models.DecimalField(max_digits=50, decimal_places=0)
            ),
        )

    def __str__(self) -> str:
        return f"number({self.number_decimal_places})"


class BaserowFormulaBooleanType(
    BaserowFormulaTypeHasEmptyBaserowExpression, BaserowFormulaValidType
):
    type = "boolean"
    baserow_field_type = "boolean"
    can_order_by_in_array = True
    can_group_by = True

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            type(self),
            BaserowFormulaTextType,
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        # true > true makes no sense
        return []

    def placeholder_empty_value(self):
        return Value(False, output_field=models.BooleanField())

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return literal(False)

    def try_coerce_to_not_null(
        self, expr: "BaserowExpression[BaserowFormulaValidType]"
    ):
        return expr

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleKeyArrayExpression(
            field_name,
            "value",
            "boolean",
            output_field=ArrayField(
                base_field=models.DecimalField(max_digits=50, decimal_places=0)
            ),
        )


def _calculate_addition_interval_type(
    arg1: BaserowExpression[BaserowFormulaValidType],
    arg2: BaserowExpression[BaserowFormulaValidType],
) -> BaserowFormulaValidType:
    arg1_type = arg1.expression_type
    arg2_type = arg2.expression_type
    if isinstance(arg1_type, BaserowFormulaDateIntervalType) and isinstance(
        arg2_type, BaserowFormulaDateIntervalType
    ):
        # interval + interval = interval
        resulting_type = arg1_type
    elif isinstance(arg1_type, BaserowFormulaDateIntervalType):
        # interval + date = date
        resulting_type = arg2_type
    else:
        # date + interval = date
        resulting_type = arg1_type
    resulting_type.nullable = arg1_type.nullable or arg2_type.nullable
    return resulting_type


# noinspection PyMethodMayBeStatic
class BaserowFormulaDateIntervalType(
    BaserowFormulaTypeHasEmptyBaserowExpression, BaserowFormulaValidType
):
    type = "date_interval"
    baserow_field_type = None
    can_group_by = True

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def addable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self), BaserowFormulaDateType]

    @property
    def subtractable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    def add(
        self,
        add_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaValidType]",
        arg2: "BaserowExpression[BaserowFormulaValidType]",
    ):
        return add_func_call.with_valid_type(
            _calculate_addition_interval_type(arg1, arg2)
        )

    def minus(
        self,
        minus_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaValidType]",
        arg2: "BaserowExpression[BaserowFormulaValidType]",
    ):
        return minus_func_call.with_valid_type(
            BaserowFormulaDateIntervalType(
                nullable=arg1.expression_type.nullable or arg2.expression_type.nullable
            )
        )

    def get_baserow_field_instance_and_type(self):
        # Until Baserow has a duration field type implement the required methods below
        return self, self

    def get_model_field(self, instance, **kwargs) -> models.Field:
        from baserow.contrib.database.fields.fields import (
            DurationFieldUsingPostgresFormatting,
        )

        kwargs["null"] = True
        kwargs["blank"] = True

        return DurationFieldUsingPostgresFormatting(**kwargs)

    def get_response_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        return self.get_serializer_field(instance, **kwargs)

    def get_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        required = kwargs.get("required", False)

        return serializers.CharField(
            **{"required": required, "allow_null": not required, **kwargs}
        )

    def get_export_value(self, value, field_object, rich_value=False) -> Any:
        if rich_value:
            return value
        else:
            return value if value is not None else ""

    def contains_query(self, field_name, value, model_field, field):
        return Q()

    def get_alter_column_prepare_old_value(self, connection, from_field, to_field):
        return None

    def get_human_readable_value(self, value: Any, field_object) -> str:
        human_readable_value = self.get_export_value(
            value, field_object, rich_value=False
        )
        if human_readable_value is None:
            return ""
        else:
            return str(human_readable_value)

    def placeholder_empty_value(self):
        return Value(datetime.timedelta(hours=0), output_field=models.DurationField())

    def placeholder_empty_baserow_expression(
        self,
    ) -> "BaserowExpression[BaserowFormulaValidType]":
        return literal(datetime.timedelta(hours=0))

    def is_searchable(self, field):
        return True

    def get_search_expression(self, field: Field, queryset: QuerySet) -> Expression:
        return Cast(field.db_column, output_field=models.TextField())


class BaserowFormulaDateType(BaserowFormulaValidType):
    type = "date"
    baserow_field_type = "date"
    user_overridable_formatting_option_fields = [
        "date_format",
        "date_include_time",
        "date_time_format",
        "date_show_tzinfo",
        "date_force_timezone",
    ]
    nullable_option_fields = ["date_force_timezone"]
    can_represent_date = True
    can_order_by_in_array = True
    can_group_by = True

    def __init__(
        self,
        date_format: str,
        date_include_time: bool,
        date_time_format: str,
        date_show_tzinfo: bool = False,
        date_force_timezone: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.date_format = date_format
        self.date_include_time = date_include_time
        self.date_time_format = date_time_format
        self.date_show_tzinfo = date_show_tzinfo
        self.date_force_timezone = date_force_timezone

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            type(self),
            BaserowFormulaTextType,
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def addable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [BaserowFormulaDateIntervalType]

    @property
    def subtractable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self), BaserowFormulaDateIntervalType]

    def add(
        self,
        add_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaValidType]",
        arg2: "BaserowExpression[BaserowFormulaValidType]",
    ):
        return add_func_call.with_valid_type(
            _calculate_addition_interval_type(arg1, arg2)
        )

    def minus(
        self,
        minus_func_call: "BaserowFunctionCall[UnTyped]",
        arg1: "BaserowExpression[BaserowFormulaValidType]",
        arg2: "BaserowExpression[BaserowFormulaValidType]",
    ):
        arg1_type = arg1.expression_type
        arg2_type = arg2.expression_type
        if isinstance(arg2_type, BaserowFormulaDateType):
            # date - date = interval
            resulting_type = BaserowFormulaDateIntervalType(
                nullable=arg1_type.nullable or arg2_type.nullable
            )
        else:
            # date - interval = date
            resulting_type = arg1_type
        return minus_func_call.with_valid_type(resulting_type)

    def should_recreate_when_old_type_was(self, old_type: "BaserowFormulaType") -> bool:
        if isinstance(old_type, BaserowFormulaDateType):
            return self.date_include_time != old_type.date_include_time
        else:
            return True

    def wrap_at_field_level(self, expr: "BaserowExpression[BaserowFormulaType]"):
        wrapped = formula_function_registry.get("bc_to_null")(expr)
        return super().wrap_at_field_level(wrapped)

    def unwrap_at_field_level(self, expr: "BaserowFunctionCall[BaserowFormulaType]"):
        unwrapped = super().unwrap_at_field_level(expr)
        return unwrapped.args[0].with_valid_type(unwrapped.expression_type)

    def cast_to_text(
        self,
        to_text_func_call: BaserowFunctionCall[UnTyped],
        arg: BaserowExpression[BaserowFormulaValidType],
    ) -> BaserowExpression[BaserowFormulaValidType]:
        when_empty = formula_function_registry.get("when_empty")
        datetime_format_tz = formula_function_registry.get("datetime_format_tz")
        date_format_string = literal(get_date_time_format(self, "sql"))
        convert_to_timezone = literal(self.date_force_timezone or "UTC")

        return when_empty(
            datetime_format_tz(arg, date_format_string, convert_to_timezone),
            literal(""),
        )

    def placeholder_empty_value(self):
        if self.date_include_time:
            field = models.DateTimeField()
        else:
            field = models.DateField()

        return Value(timezone.now(), output_field=field)

    def get_search_expression_in_array(self, field, queryset):
        def transform_value_to_text_func(x):
            return Func(
                Func(
                    # FIXME: what if date_force_timezone is None(user timezone)?
                    Value(field.date_force_timezone or "UTC"),
                    Cast(x, output_field=models.DateTimeField()),
                    function="timezone",
                    output_field=models.DateTimeField(),
                ),
                Value(get_date_time_format(self, "sql")),
                function="to_char",
                output_field=models.TextField(),
            )

        return extract_jsonb_array_values_to_single_string(
            field,
            queryset,
            transform_value_to_text_func=transform_value_to_text_func,
        )

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleKeyArrayExpression(
            field_name, "value", "timestamp", output_field=models.DateTimeField()
        )

    def __str__(self) -> str:
        date_or_datetime = "datetime" if self.date_include_time else "date"
        optional_time_format = (
            f", {self.date_time_format}" if self.date_include_time else ""
        )
        return f"{date_or_datetime}({self.date_format}{optional_time_format})"


class BaserowFormulaSingleFileType(BaserowJSONBObjectBaseType):
    type = "single_file"
    can_group_by = False
    can_order_by = False
    can_order_by_in_array = False
    baserow_field_type = None
    item_is_in_nested_value_object_when_in_array = False

    def is_searchable(self, field):
        return True

    def placeholder_empty_value(self):
        return Value(None, output_field=JSONField())

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    def get_model_field(self, instance, **kwargs) -> models.Field:
        return JSONField(default=dict, **kwargs)

    def get_baserow_field_instance_and_type(self):
        return self, self

    def get_response_serializer_field(self, instance, **kwargs):
        from baserow.contrib.database.api.fields.serializers import (
            FileFieldResponseSerializer,
        )

        return FileFieldResponseSerializer(**{"required": False, **kwargs})

    def get_serializer_field(self, instance, **kwargs):
        required = kwargs.get("required", False)
        from baserow.contrib.database.api.fields.serializers import (
            FileFieldRequestSerializer,
        )

        return FileFieldRequestSerializer(
            **{
                "required": required,
                "allow_null": not required,
                **kwargs,
            }
        )

    def get_export_value(self, value, field_object, rich_value=False) -> Any:
        file = value
        if "url" in file:
            url = file["url"]
        elif "name" in file:
            from baserow.core.user_files.handler import UserFileHandler

            path = UserFileHandler().user_file_path(file["name"])
            url = default_storage.url(path)
        else:
            url = None

        export_file = {
            "visible_name": file["visible_name"],
            "name": file["name"],
            "url": url,
        }

        if rich_value:
            return {
                "visible_name": export_file["visible_name"],
                "url": export_file["url"],
            }
        else:
            return f'{export_file["visible_name"]}({export_file["url"]})'

    def contains_query(self, field_name, value, model_field, field):
        value = value.strip()
        # If an empty value has been provided we do not want to filter at all.
        if value == "":
            return Q()
        return Q(**{f"{field_name}__visible_name__icontains": value})

    def get_alter_column_prepare_old_value(self, connection, from_field, to_field):
        sql = f"""
            p_in = p_in->'visible_name';
        """
        return sql, {}

    def get_human_readable_value(self, value, field_object) -> str:
        if value is None:
            return ""
        return self.get_export_value(value, field_object, rich_value=False) or ""

    def cast_to_text(
        self,
        to_text_func_call: "BaserowFunctionCall[UnTyped]",
        arg: "BaserowExpression[BaserowFormulaValidType]",
    ) -> "BaserowExpression[BaserowFormulaType]":
        single_select_value = formula_function_registry.get("get_single_select_value")(
            arg
        )
        return formula_function_registry.get("when_empty")(
            single_select_value, literal("")
        )

    def get_search_expression(self, field, queryset):
        return Cast(
            F(field.db_column + "__visible_name"), output_field=models.TextField()
        )

    def get_search_expression_in_array(self, field, queryset):
        return extract_jsonb_array_values_to_single_string(
            field,
            queryset,
            path_to_value_in_jsonb_list=[
                Value("visible_name", output_field=models.TextField()),
            ],
        )


class BaserowFormulaArrayType(BaserowFormulaValidType):
    type = "array"
    user_overridable_formatting_option_fields = [
        "array_formula_type",
    ]
    can_group_by = False

    def __init__(self, sub_type: BaserowFormulaValidType, **kwargs):
        super().__init__(**kwargs)
        self.array_formula_type = sub_type.type
        self.sub_type = sub_type

    def get_search_expression(self, field, queryset):
        return self.sub_type.get_search_expression_in_array(field, queryset)

    def is_searchable(self, field):
        return True

    @classmethod
    def construct_type_from_formula_field(cls, formula_field):
        sub_type_cls = _lookup_formula_type_from_string(
            formula_field.array_formula_type
        )
        sub_type = sub_type_cls.construct_type_from_formula_field(formula_field)
        return cls(sub_type)

    def persist_onto_formula_field(self, formula_field):
        self.sub_type.persist_onto_formula_field(formula_field)
        formula_field.array_formula_type = self.sub_type.type
        formula_field.formula_type = self.type

    def new_type_with_user_and_calculated_options_merged(self, formula_field):
        new_sub_type = self.sub_type.new_type_with_user_and_calculated_options_merged(
            formula_field
        )
        return self.__class__(new_sub_type)

    def collapse_many(self, expr: "BaserowExpression[BaserowFormulaType]"):
        return expr.expression_type.sub_type.collapse_array_of_many(expr)

    def placeholder_empty_value(self):
        """
        The use of `array_agg_unnesting` in `self.collapse_many` above means that we can
        never have null values inserted into array fields but instead they should be
        empty lists.

        This is because during template imports we can run update statements using
        `array_agg_unnesting` over array fields which have just been filled with empty
        data and not had their actual values calculated yet. If they instead defaulted
        to Value(None) (null) these update statements would fail as the use of
        `jsonb_array_elements` by `array_agg_unnesting` crashes if you give in null
        instead of [] with
        `django.db.utils.DataError: cannot extract elements from a scalar`
        """

        return Value([], output_field=JSONField())

    def wrap_at_field_level(self, expr: "BaserowExpression[BaserowFormulaType]"):
        return formula_function_registry.get("error_to_null")(expr)

    def unwrap_at_field_level(self, expr: "BaserowFunctionCall[BaserowFormulaType]"):
        arg = expr.args[0]
        # By unwrapping a field's array_agg we can then use our own aggregate
        # functions or apply our own transformations on the underlying many
        # expression.
        single_unnest = formula_function_registry.get("array_agg")
        double_unnest = formula_function_registry.get("array_agg_unnesting")
        multiple_select_agg = formula_function_registry.get(
            "multiple_select_options_agg"
        )
        string_agg_array_of_multiple_select_values = formula_function_registry.get(
            "string_agg_array_of_multiple_select_values"
        )

        sub_type = expr.expression_type.sub_type
        if isinstance(arg, BaserowFunctionCall):
            if arg.function_def.type in (single_unnest.type, multiple_select_agg.type):
                arg = arg.args[0]
            elif arg.function_def.type == double_unnest.type:
                arg = arg.args[0]
                sub_type = BaserowFormulaArrayType(sub_type)
            elif (
                arg.function_def.type == string_agg_array_of_multiple_select_values.type
            ):
                sub_type = BaserowFormulaArrayType(sub_type)
        elif isinstance(arg, BaserowFieldReference):
            sub_type = BaserowFormulaArrayType(sub_type)

        return arg.with_valid_type(sub_type)

    @property
    def baserow_field_type(self) -> str:
        return "unknown"

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    def get_baserow_field_instance_and_type(self):
        # Until Baserow has a array field type implement the required methods below
        return self, self

    def get_model_field(self, instance, **kwargs) -> models.Field:
        return JSONField(default=list, **kwargs)

    def get_response_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        return self.get_serializer_field(instance, **kwargs)

    def get_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        required = kwargs.get("required", False)

        from baserow.contrib.database.api.fields.serializers import ArrayValueSerializer

        (
            instance,
            field_type,
        ) = self.sub_type.get_baserow_field_instance_and_type()
        if self.sub_type.item_is_in_nested_value_object_when_in_array:
            serializer = ArrayValueSerializer(
                field_type.get_response_serializer_field(instance)
            )
        else:
            serializer = field_type.get_response_serializer_field(instance)
        return serializers.ListSerializer(
            **{
                "required": required,
                "allow_null": not required,
                "child": serializer,
                **kwargs,
            }
        )

    def get_export_value(self, value, field_object, rich_value=False) -> Any:
        if value is None:
            return [] if rich_value else ""

        field_instance, field_type = self.sub_type.get_baserow_field_instance_and_type()
        field_obj = {
            "field": field_instance,
            "type": field_type,
            "name": field_object["name"],
        }

        result = self._map_safely_across_lookup_json_value_list(
            lambda safe_value: field_type.get_export_value(
                safe_value, field_obj, rich_value=rich_value
            ),
            value,
        )

        if rich_value:
            return result
        else:
            return list_to_comma_separated_string(result)

    def contains_query(self, field_name, value, model_field, field):
        return Q()

    def get_alter_column_prepare_old_value(self, connection, from_field, to_field):
        return "p_in = '';"

    def get_human_readable_value(self, value: Any, field_object) -> str:
        if value is None:
            return ""

        field_instance, field_type = self.sub_type.get_baserow_field_instance_and_type()
        field_obj = {
            "field": field_instance,
            "type": field_type,
            "name": field_object["name"],
        }

        human_readable_values = self._map_safely_across_lookup_json_value_list(
            lambda safe_value: field_type.get_human_readable_value(
                safe_value, field_obj
            ),
            value,
        )

        return ", ".join(human_readable_values)

    def _map_safely_across_lookup_json_value_list(
        self, map_func, lookup_json_value_list
    ):
        human_readable_values = []
        for v in lookup_json_value_list:
            if self.sub_type.item_is_in_nested_value_object_when_in_array:
                list_item = v["value"]
            else:
                list_item = v
            if list_item is not None and self.sub_type.type == "date":
                # Arrays are stored as JSON which means the dates are converted to
                # strings, we need to reparse them back first before giving it to
                # the date field type.
                list_item = parser.isoparse(list_item)
            export_value = map_func(list_item)
            if export_value is None:
                export_value = ""
            human_readable_values.append(export_value)
        return human_readable_values

    @property
    def can_order_by(self) -> bool:
        return self.sub_type.can_order_by_in_array

    def get_order(
        self, field, field_name, order_direction
    ) -> OptionallyAnnotatedOrderBy:
        expr = self.sub_type.get_order_by_in_array_expr(
            field, field_name, order_direction
        )
        annotation_name = f"{field_name}_agg_sort_array"
        annotation = {annotation_name: expr}
        field_expr = F(annotation_name)

        if order_direction == "ASC":
            field_order_by = field_expr.asc(nulls_first=True)
        else:
            field_order_by = field_expr.desc(nulls_last=True)

        return OptionallyAnnotatedOrderBy(
            annotation=annotation, order=field_order_by, can_be_indexed=False
        )

    def get_value_for_filter(self, row, field) -> any:
        return None

    def check_if_compatible_with(self, compatible_formula_types: List[str]):
        return (
            self.type in compatible_formula_types
            or str(self) in compatible_formula_types
        )

    def __str__(self) -> str:
        return self.formula_array_type_as_str(self.sub_type)

    @classmethod
    def formula_array_type_as_str(cls, sub_type):
        return f"array({sub_type})"


class BaserowFormulaSingleSelectType(BaserowJSONBObjectBaseType):
    type = "single_select"
    baserow_field_type = "single_select"
    can_order_by = True
    can_order_by_in_array = True
    can_group_by = False

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [
            type(self),
            BaserowFormulaTextType,
        ]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    def get_baserow_field_instance_and_type(self):
        return self, self

    def get_model_field(self, instance, **kwargs) -> models.Field:
        return JSONField(default=dict, **kwargs)

    def get_response_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        instance, field_type = super().get_baserow_field_instance_and_type()
        return field_type.get_response_serializer_field(instance, **kwargs)

    def get_serializer_field(self, *args, **kwargs) -> Optional[Field]:
        instance, field_type = super().get_baserow_field_instance_and_type()
        return field_type.get_response_serializer_field(instance, **kwargs)

    def get_export_value(self, value, field_object, rich_value=False) -> Any:
        if value is None:
            return value if rich_value else ""
        return value["value"]

    def contains_query(self, field_name, value, model_field, field):
        value = value.strip()
        # If an empty value has been provided we do not want to filter at all.
        if value == "":
            return Q()
        return Q(**{f"{field_name}__value__icontains": value})

    def get_alter_column_prepare_old_value(self, connection, from_field, to_field):
        sql = f"""
            p_in = p_in->'value';
        """
        return sql, {}

    def get_human_readable_value(self, value, field_object) -> str:
        if value is None:
            return ""
        return self.get_export_value(value, field_object, rich_value=False) or ""

    def cast_to_text(
        self,
        to_text_func_call: "BaserowFunctionCall[UnTyped]",
        arg: "BaserowExpression[BaserowFormulaValidType]",
    ) -> "BaserowExpression[BaserowFormulaType]":
        single_select_value = formula_function_registry.get("get_single_select_value")(
            arg
        )
        return formula_function_registry.get("when_empty")(
            single_select_value, literal("")
        )

    def get_search_expression(self, field, queryset):
        return Cast(F(field.db_column + "__value"), output_field=models.TextField())

    def get_search_expression_in_array(self, field, queryset):
        return extract_jsonb_array_values_to_single_string(
            field,
            queryset,
            path_to_value_in_jsonb_list=[
                Value("value", output_field=models.TextField()),
                Value("value", output_field=models.TextField()),
            ],
        )

    def is_searchable(self, field):
        return True

    def get_order(
        self, field, field_name, order_direction
    ) -> OptionallyAnnotatedOrderBy:
        field_expr = F(f"{field_name}__value")

        if order_direction == "ASC":
            field_order_by = field_expr.asc(nulls_first=True)
        else:
            field_order_by = field_expr.desc(nulls_last=True)

        return OptionallyAnnotatedOrderBy(order=field_order_by, can_be_indexed=True)

    def get_value_for_filter(self, row, field) -> any:
        return getattr(row, field.db_column)["value"]

    def get_order_by_in_array_expr(self, field, field_name, order_direction):
        return JSONBSingleInnerKeyArrayExpression(
            field_name,
            "value",
            "jsonb",
            "value",
            "text",
            output_field=ArrayField(
                base_field=models.DecimalField(max_digits=50, decimal_places=0)
            ),
        )


class BaserowFormulaMultipleSelectType(BaserowJSONBObjectBaseType):
    type = "multiple_select"
    baserow_field_type = "multiple_select"
    can_order_by = False
    can_order_by_in_array = False
    can_group_by = False

    @property
    def comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return [type(self)]

    @property
    def limit_comparable_types(self) -> List[Type["BaserowFormulaValidType"]]:
        return []

    def get_baserow_field_instance_and_type(self):
        return self, self

    def get_model_field(self, instance, **kwargs) -> models.Field:
        return JSONField(default=list, **kwargs)

    def get_response_serializer_field(self, instance, **kwargs) -> Optional[Field]:
        instance, field_type = super().get_baserow_field_instance_and_type()
        return field_type.get_response_serializer_field(instance, **kwargs)

    def get_serializer_field(self, *args, **kwargs) -> Optional[Field]:
        instance, field_type = super().get_baserow_field_instance_and_type()
        return field_type.get_response_serializer_field(instance, **kwargs)

    def get_export_value(self, value, field_object, rich_value=False):
        if value is None:
            return [] if rich_value else ""

        result = [item["value"] for item in value]

        if rich_value:
            return result
        else:
            return list_to_comma_separated_string(result)

    def get_human_readable_value(self, value, field_object):
        export_value = self.get_export_value(value, field_object, rich_value=True)

        return ", ".join(export_value)

    def is_searchable(self, field):
        return True

    def get_search_expression(self, field, queryset):
        return extract_jsonb_array_values_to_single_string(
            field, queryset, [Value("value")]
        )

    def get_search_expression_in_array(self, field, queryset):
        inner_expr = json_extract_path(
            Func(
                F(field.db_column),
                function="jsonb_array_elements",
                output_field=JSONField(),
            ),
            [Value("value")],
            False,
        )

        return Func(
            extract_jsonb_list_values_to_array(queryset, inner_expr, [Value("value")]),
            Value(" "),
            function="array_to_string",
            output_field=TextField(),
        )

    def cast_to_text(
        self,
        to_text_func_call: "BaserowFunctionCall[UnTyped]",
        arg: "BaserowExpression[BaserowFormulaValidType]",
    ) -> "BaserowExpression[BaserowFormulaType]":
        join_multiple_select_values = formula_function_registry.get(
            "string_agg_multiple_select_values"
        )
        when_empty = formula_function_registry.get("when_empty")
        return when_empty(join_multiple_select_values(arg), literal(""))

    def is_blank(
        self,
        func_call: BaserowFunctionCall[UnTyped],
        arg: BaserowExpression[BaserowFormulaValidType],
    ) -> BaserowExpression[BaserowFormulaBooleanType]:
        equal_expr = formula_function_registry.get("equal")
        count_expr = formula_function_registry.get("multiple_select_count")
        return equal_expr(count_expr(arg), literal(0))

    def collapse_many(self, expr: BaserowExpression[BaserowFormulaType]):
        return formula_function_registry.get("multiple_select_options_agg")(expr)

    def count(
        self,
        func_call: BaserowFunctionCall[UnTyped],
        arg: BaserowExpression[BaserowFormulaValidType],
    ) -> BaserowExpression[BaserowFormulaType]:
        return formula_function_registry.get("multiple_select_count")(arg)


BASEROW_FORMULA_TYPES = [
    BaserowFormulaInvalidType,
    BaserowFormulaTextType,
    BaserowFormulaCharType,
    BaserowFormulaButtonType,
    BaserowFormulaLinkType,
    BaserowFormulaDateIntervalType,
    BaserowFormulaDateType,
    BaserowFormulaBooleanType,
    BaserowFormulaNumberType,
    BaserowFormulaArrayType,
    BaserowFormulaSingleSelectType,
    BaserowFormulaMultipleSelectType,
    BaserowFormulaSingleFileType,
]

BASEROW_FORMULA_TYPE_ALLOWED_FIELDS = list(
    set(
        allowed_field for f in BASEROW_FORMULA_TYPES for allowed_field in f.all_fields()
    )
)

BASEROW_FORMULA_TYPE_CHOICES = [(f.type, f.type) for f in BASEROW_FORMULA_TYPES]
BASEROW_FORMULA_ARRAY_TYPE_CHOICES = [
    (f.type, f.type)
    for f in BASEROW_FORMULA_TYPES
    if f.type != BaserowFormulaArrayType.type
]


def calculate_number_type(
    arg_types: List[BaserowFormulaNumberType], min_decimal_places=0
):
    max_number_decimal_places = min_decimal_places
    for a in arg_types:
        max_number_decimal_places = max(
            max_number_decimal_places, a.number_decimal_places
        )

    return BaserowFormulaNumberType(number_decimal_places=max_number_decimal_places)


def _lookup_formula_type_from_string(formula_type_string):
    for possible_type in BASEROW_FORMULA_TYPES:
        if formula_type_string == possible_type.type:
            return possible_type
    raise UnknownFormulaType(formula_type_string)


def literal(
    arg: Union[str, int, bool, Decimal, datetime.timedelta]
) -> BaserowExpression[BaserowFormulaValidType]:
    """
    A helper function for building BaserowExpressions with literals
    :param arg: The literal
    :return: The literal wrapped in the corresponding valid typed BaserowExpression
        literal.
    """

    if isinstance(arg, str):
        return BaserowStringLiteral(arg, BaserowFormulaTextType())
    elif isinstance(arg, bool):
        return BaserowBooleanLiteral(arg, BaserowFormulaBooleanType())
    elif isinstance(arg, int):
        return BaserowIntegerLiteral(
            arg, BaserowFormulaNumberType(number_decimal_places=0)
        )
    elif isinstance(arg, Decimal):
        decimal_literal_expr = BaserowDecimalLiteral(arg, None)
        return decimal_literal_expr.with_valid_type(
            BaserowFormulaNumberType(decimal_literal_expr.num_decimal_places())
        )
    elif isinstance(arg, datetime.timedelta):
        return formula_function_registry.get("date_interval")(literal("0 hours"))

    raise TypeError(f"Unknown literal type {type(arg)}")


class JSONBSingleKeyArrayExpression(Expression):
    template = """
        (
            SELECT ARRAY_AGG(items.{key_name})
            FROM jsonb_to_recordset({field_name}) as items(
            {key_name} {data_type})
        )
        """  # nosec B608
    # fmt: on

    def __init__(self, field_name: str, key_name: str, data_type: str, **kwargs):
        super().__init__(**kwargs)
        self.field_name = field_name
        self.key_name = key_name
        self.data_type = data_type

    def as_sql(self, compiler, connection, template=None):
        template = template or self.template
        data = {
            "field_name": f'"{self.field_name}"',
            "key_name": f'"{self.key_name}"',
            "data_type": self.data_type,
        }

        return template.format(**data), []


class JSONBSingleInnerKeyArrayExpression(Expression):
    template = """
        (
            SELECT ARRAY_AGG(items.{key_name}->>{inner_key_name}::{inner_data_type})
            FROM jsonb_to_recordset({field_name}) as items(
            {key_name} {data_type})
        )
        """  # nosec B608
    # fmt: on

    def __init__(
        self,
        field_name: str,
        key_name: str,
        data_type: str,
        inner_key_name: str,
        inner_data_type: str,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.field_name = field_name
        self.key_name = key_name
        self.data_type = data_type
        self.inner_key_name = inner_key_name
        self.inner_data_type = inner_data_type

    def as_sql(self, compiler, connection, template=None):
        template = template or self.template
        data = {
            "field_name": f'"{self.field_name}"',
            "key_name": f'"{self.key_name}"',
            "data_type": self.data_type,
            "inner_key_name": f"'{self.inner_key_name}'",
            "inner_data_type": self.inner_data_type,
        }

        return template.format(**data), []
