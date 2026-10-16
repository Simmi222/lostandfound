from django.urls import path
# pyrefly: ignore [missing-import]
from .views import (
    DashboardView,
    MyMatchesView,
    MatchDetailView,
    SearchPhotoView,
    SearchNameView,
    SimilarMatchesView,
    RecordMatchDecisionView,
)

urlpatterns = [
    path("dashboard/",       DashboardView.as_view(),           name="dashboard"),
    path("mine/",            MyMatchesView.as_view(),           name="my-matches"),
    path("<int:pk>/",        MatchDetailView.as_view(),         name="match-detail"),
    path("search/",          SearchPhotoView.as_view(),         name="face-search"),
    path("search-by-name/",  SearchNameView.as_view(),          name="name-search"),
    path("similar/",          SimilarMatchesView.as_view(),      name="similar-matches"),
    path("record-decision/", RecordMatchDecisionView.as_view(), name="record-decision"),
]